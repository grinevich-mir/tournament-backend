import { WalletEntryEntity, PlatformWalletEntity, WalletAccountEntity, WalletTransactionEntity, UserWalletEntity, WalletEntity } from '../entities';
import { GlobalDB, transactionRetry } from '../../core/db';
import { TransactionDescriptor } from './transfer-descriptor';
import { Inject, Singleton } from '../../core/ioc';
import { WalletType } from '../wallet-type';
import { EntityManager } from 'typeorm';
import { TransferConfig } from './transfer-config';
import { WalletFlow } from '../wallet-flow';
import { NotFoundError, Redis, InsufficientFundsError } from '../../core';
import { toMoney, Money, roundMoney } from '../utilities';
import _ from 'lodash';
import Logger, { LogClass } from '../../core/logging';
import { CurrencyManager } from '../currency-manager';
import { WalletEntry } from '../wallet-entry';
import { WalletEntityMapper, WalletEntryEntityMapper } from '../entities/mappers';
import { UserWallet, Wallet } from '../wallet';
import { WalletAccount } from '../wallet-account';
import { UserWalletAccounts } from '../user-wallet-accounts';
import { Websocket } from '../../websocket';
import { NumericTransformer } from '../../core/db/orm';

interface TransactionSumResult {
    balance: Money;
    baseBalance: Money;
}

@Singleton
@LogClass({ arguments: false, result: false })
export class TransferProcessor {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly currencyManager: CurrencyManager,
        @Inject private readonly walletEntityMapper: WalletEntityMapper,
        @Inject private readonly entryEntityMapper: WalletEntryEntityMapper,
        @Inject private readonly redis: Redis,
        @Inject private readonly websocket: Websocket) {
    }

    public async process(config: TransferConfig): Promise<WalletEntry> {
        if (config.amount <= 0)
            throw new Error('Amount must be more than zero.');

        if (config.externalRef && await this.externalRefExists(config.externalRef))
            throw new Error(`Wallet entry external reference already exists: ${config.externalRef}`);

        const connection = await this.db.getConnection();

        const createdEntry = await transactionRetry(connection, async manager => {
            const transactions: WalletTransactionEntity[] = [];
            let lastTransaction: WalletTransactionEntity | undefined;

            const baseAmount = await this.convert(toMoney(config.amount), config.currencyCode, 'USD');

            Logger.info('Getting affected wallets and accounts...');
            const [wallets, accounts] = await this.getWalletsAndAccounts(manager, config);
            Logger.info('Affected wallets and accounts', { wallets, accounts });
            const sourceAccount = _.first(accounts) as WalletAccount;

            const amount = await this.convert(toMoney(config.amount), config.currencyCode, sourceAccount.currencyCode);
            const newBalance = roundMoney(toMoney(sourceAccount.balance).subtract(amount), sourceAccount.currencyCode);

            Logger.info(`New balance for source account: ${newBalance} ${sourceAccount.currencyCode}.`);

            if (newBalance < 0 && !sourceAccount.allowNegative) {
                Logger.error(`Insufficient funds in account ${sourceAccount.id} - balance would be ${newBalance}`);
                throw new InsufficientFundsError();
            }

            const entry = new WalletEntryEntity();
            entry.purpose = config.purpose;
            entry.memo = config.memo;
            entry.externalRef = config.externalRef;
            entry.requesterType = config.requesterType;
            entry.requesterId = config.requesterId.toString();

            if (config.linkedEntryId)
                entry.linkedEntryId = config.linkedEntryId;

            const result = await manager.insert(WalletEntryEntity, entry);
            entry.id = result.identifiers[0].id;

            Logger.info(`Created wallet entry ${entry.id}.`);
            Logger.info('Processing descriptors...');
            for (const descriptor of config.descriptors) {
                const [transaction] = await this.processDescriptor(entry, descriptor, wallets, accounts, config, baseAmount, lastTransaction);

                lastTransaction = transaction;

                transactions.push(transaction);
            }

            const total = this.sumTransactions(transactions);

            if (!total.baseBalance.isZero())
                throw new Error(`Entry balance should equal zero but was ${total.baseBalance.toUnit()}`);

            for (const transaction of transactions) {
                const insertResult = await manager.createQueryBuilder()
                    .insert()
                    .into(WalletTransactionEntity)
                    .values(transaction)
                    .updateEntity(false)
                    .execute();

                transaction.id = Number(insertResult.raw.insertId);
            }

            await manager.createQueryBuilder()
                .relation(WalletEntryEntity, 'accounts')
                .of(entry)
                .add(accounts);

            const walletIds = _.uniq(accounts.map(a => a.walletId));
            await manager.createQueryBuilder()
                .relation(WalletEntryEntity, 'wallets')
                .of(entry)
                .add(walletIds);

            await this.updateAccountBalances(manager, wallets, accounts, transactions);
            return entry;
        }).execute();

        return this.entryEntityMapper.fromEntity(createdEntry);
    }

    private async processDescriptor(
        entry: WalletEntryEntity,
        descriptor: TransactionDescriptor,
        wallets: Wallet[],
        accounts: WalletAccount[],
        config: TransferConfig,
        baseAmount: Money,
        lastTransaction?: WalletTransactionEntity): Promise<[WalletTransactionEntity, WalletAccount]> {
        Logger.info('Processing descriptor:', descriptor);
        const wallet = this.findWallet(wallets, descriptor);

        if (!descriptor.bypassFlow) {
            if (descriptor.type === 'Debit' && wallet.flow === WalletFlow.Inbound)
                throw new Error(`Wallet ${wallet.id} flow is Inbound only and cannot be debited.`);
            if (descriptor.type === 'Credit' && wallet.flow === WalletFlow.Outbound)
                throw new Error(`Wallet ${wallet.id} flow is Outbound only and cannot be credited.`);
        }

        const account = this.findAccount(wallet, accounts, descriptor, config);
        let amount = toMoney(config.amount);
        const currency = account.currencyCode;
        const exchangeRate = await this.getRate(account.currencyCode);

        if (!lastTransaction)
            amount = await this.convert(amount, config.currencyCode, account.currencyCode);
        else
            amount = await this.convert(toMoney(Math.abs(lastTransaction.amountRaw)), lastTransaction.currencyCode, currency);

        if (descriptor.type === 'Debit') {
            amount = toMoney(-Math.abs(amount.toUnit()));
            baseAmount = toMoney(-Math.abs(baseAmount.toUnit()));
        } else {
            amount = toMoney(Math.abs(amount.toUnit()));
            baseAmount = toMoney(Math.abs(baseAmount.toUnit()));
        }

        const transaction = new WalletTransactionEntity();
        transaction.amount = roundMoney(amount, currency);
        transaction.amountRaw = amount.toUnit();
        transaction.currencyCode = currency;
        transaction.exchangeRate = exchangeRate;
        transaction.baseAmount = baseAmount.toUnit();
        transaction.purpose = config.purpose;
        transaction.requesterType = config.requesterType;
        transaction.requesterId = config.requesterId.toString();
        transaction.walletId = wallet.id;
        transaction.accountId = account.id;
        transaction.entryId = entry.id;

        return [transaction, account];
    }

    private async updateAccountBalances(manager: EntityManager, wallets: Wallet[], accounts: WalletAccount[], transactions: WalletTransactionEntity[]): Promise<void> {
        const accountIds = _.uniq(accounts.map(a => a.id));
        const transactionIds = transactions.map(t => t.id);
        const transactionPlaceholders = _.fill(Array(transactions.length), '?');
        const accountPlaceholders = _.fill(Array(accountIds.length), '?');

        Logger.info(`Updating balances for accounts ${accountIds.join(', ')}...`);

        const query = `
            UPDATE
                wallet_account WA
            INNER JOIN
                (
                    SELECT
                        WT.accountId,
                        SUM(WT.amount) as balance,
                        SUM(WT.amountRaw) as balanceRaw,
                        SUM(WT.baseAmount) as baseBalance
                    FROM
                        wallet_transaction WT
                    WHERE
                        WT.id IN(${transactionPlaceholders.join(',')})
                    GROUP BY
                        WT.accountId
                ) TOTALS
                ON TOTALS.accountId = WA.id
            SET
                WA.balance = WA.balance + TOTALS.balance,
                WA.balanceRaw = WA.balanceRaw + TOTALS.balanceRaw,
                WA.baseBalance = WA.baseBalance + TOTALS.baseBalance,
                WA.balanceUpdateTime = CURRENT_TIMESTAMP
            WHERE
                WA.id IN(${accountPlaceholders.join(',')})`;

        await manager.query(query, transactionIds.concat(accountIds));
        Logger.info('Account balances updated.');

        await this.notifyBalanceUpdates(manager, wallets, accounts);
    }

    private async convert(amount: Money, fromCurrencyCode: string, toCurrencyCode: string): Promise<Money> {
        let result = amount;
        let fromRate = 1;
        let toRate = 1;

        if (fromCurrencyCode !== toCurrencyCode) {
            fromRate = await this.getRate(fromCurrencyCode);
            toRate = await this.getRate(toCurrencyCode);
            const baseAmount = amount.multiply(fromRate);
            result = baseAmount.divide(toRate);
        }

        Logger.info(`Converted: ${amount.toUnit()} ${fromCurrencyCode} @${fromRate} to ${result.toUnit()} ${toCurrencyCode} @${toRate}`);
        return result;
    }

    private async getRate(currencyCode: string): Promise<number> {
        if (currencyCode === 'USD')
            return 1;

        const rate = await this.currencyManager.getRate(currencyCode);

        if (!rate)
            throw new NotFoundError(`Rate for currency '${currencyCode}' not found.`);

        return rate.rate;
    }

    private async getCachedWallet(manager: EntityManager, descriptor: TransactionDescriptor): Promise<Wallet> {
        let cacheKey: string | undefined;

        switch (descriptor.target) {
            case WalletType.Platform:
                cacheKey = `CACHE:Banking:Wallet:Platform:${descriptor.wallet}`;
                break;

            case WalletType.User:
                cacheKey = `CACHE:Banking:Wallet:User:${descriptor.userId}`;
                break;
        }

        if (!cacheKey)
            throw new Error('Could not create cache key.');

        const cacheRaw = await this.redis.cluster.get(cacheKey);

        if (cacheRaw)
            return JSON.parse(cacheRaw) as Wallet;

        const wallet = await this.getWallet(manager, descriptor);
        await this.redis.cluster.pipeline().set(cacheKey, JSON.stringify(wallet)).expire(cacheKey, 86400).exec();
        return wallet;
    }

    private async getWallet(manager: EntityManager, descriptor: TransactionDescriptor): Promise<Wallet> {
        let entity: WalletEntity | undefined;

        switch (descriptor.target) {
            case WalletType.Platform:
                entity = await manager.findOne(PlatformWalletEntity, { where: { name: descriptor.wallet } });
                break;

            case WalletType.User:
                entity = await manager.findOne(UserWalletEntity, { where: { userId: descriptor.userId } });
                break;
        }

        if (!entity)
            if (descriptor.target === WalletType.Platform)
                throw new Error(`Platform '${descriptor.wallet}' wallet not found.`);
            else
                throw new Error(`User '${descriptor.userId}' wallet not found.`);

        return this.walletEntityMapper.fromEntity(entity);
    }

    private async getAccount(manager: EntityManager, wallet: Wallet, config: TransferConfig, descriptor: TransactionDescriptor): Promise<WalletAccount> {
        let name: string | undefined;

        switch (descriptor.target) {
            case WalletType.Platform:
                name = config.currencyCode;
                break;

            case WalletType.User:
                name = descriptor.account;
                break;
        }

        if (!name)
            throw new Error(`Unsupported target type: ${descriptor.target}`);

        const entity = await manager.findOne(WalletAccountEntity, { where: { walletId: wallet.id, name } });

        if (!entity)
            throw new Error(`Account '${name}' for wallet ID ${wallet.id} not found.`);

        return this.walletEntityMapper.accountFromEntity(entity);
    }

    private sumTransactions(transactions: WalletTransactionEntity[]): TransactionSumResult {
        let balance = toMoney(0);
        let baseBalance = toMoney(0);

        for (const transaction of transactions) {
            balance = balance.add(toMoney(transaction.amountRaw));
            baseBalance = baseBalance.add(toMoney(transaction.baseAmount));
        }

        return {
            balance,
            baseBalance
        };
    }

    private async getWalletsAndAccounts(manager: EntityManager, config: TransferConfig): Promise<[Wallet[], WalletAccount[]]> {
        const wallets: Wallet[] = [];
        const accounts: WalletAccount[] = [];

        for (const descriptor of config.descriptors) {
            const wallet = await this.getCachedWallet(manager, descriptor);
            const account = await this.getAccount(manager, wallet, config, descriptor);

            if (!wallets.find(w => w.id === wallet.id))
                wallets.push(wallet);
            if (!accounts.find(a => a.id === account.id))
                accounts.push(account);
        }

        return [wallets, accounts];
    }

    private findWallet(wallets: Wallet[], descriptor: TransactionDescriptor): Wallet {
        let wallet: Wallet | undefined;

        switch (descriptor.target) {
            case WalletType.Platform:
                wallet = wallets.find(w => w.type === WalletType.Platform && w.name === descriptor.wallet);
                break;

            case WalletType.User:
                wallet = wallets.find(w => w.type === WalletType.User && w.userId === descriptor.userId);
        }

        if (!wallet)
            if (descriptor.target === WalletType.Platform)
                throw new Error(`Platform '${descriptor.wallet}' wallet not found.`);
            else
                throw new Error(`User '${descriptor.userId}' wallet not found.`);

        return wallet;
    }

    private findAccount(wallet: Wallet, accounts: WalletAccount[], descriptor: TransactionDescriptor, config: TransferConfig): WalletAccount {
        let account: WalletAccount | undefined;

        switch (descriptor.target) {
            case WalletType.Platform:
                account = accounts.find(a => a.walletId === wallet.id && a.name === config.currencyCode);
                break;

            case WalletType.User:
                account = accounts.find(a => a.walletId === wallet.id && a.name === descriptor.account);
        }

        if (!account)
            if (descriptor.target === WalletType.Platform)
                throw new Error(`Platform '${descriptor.wallet}' wallet account not found.`);
            else
                throw new Error(`User ${descriptor.userId} '${descriptor.account}' wallet account not found.`);

        return account;
    }

    private async externalRefExists(ref: string): Promise<boolean> {
        const connection = await this.db.getConnection();
        return await connection.manager.count(WalletEntryEntity, {
            where: {
                externalRef: ref
            }
        }) > 0;
    }

    private async notifyBalanceUpdates(manager: EntityManager, wallets: Wallet[], accounts: WalletAccount[]): Promise<void> {
        const userWallets = wallets.filter(w => w.type === WalletType.User).map(w => w as UserWallet);

        if (userWallets.length === 0)
           return;

        const notifyAccountTypes = [UserWalletAccounts.Diamonds, UserWalletAccounts.Withdrawable];
        const notifyAccounts: WalletAccount[] = accounts.filter(a => userWallets.find(w => w.id === a.walletId) && notifyAccountTypes.includes(a.name as UserWalletAccounts));

        if (notifyAccounts.length === 0)
            return;

        const balances = await manager.createQueryBuilder(WalletAccountEntity, 'account')
                    .select(['id', 'balance', 'balanceRaw', 'baseBalance'])
                    .whereInIds(notifyAccounts.map(a => a.id))
                    .execute() as { id: number, balance: string, balanceRaw: string, baseBalance: string }[];

        const transformer = new NumericTransformer();

        for (const account of notifyAccounts) {
            const balance = balances.find(b => b.id === account.id);

            if (!balance) {
                Logger.error(`Could not find balance for account ID ${account.id}`);
                continue;
            }

            account.balance = transformer.from(balance.balance) as number;
            account.baseBalance = transformer.from(balance.baseBalance) as number;
            account.balanceRaw = transformer.from(balance.balanceRaw) as number;
        }

        for (const wallet of userWallets) {
            const walletAccounts = notifyAccounts.filter(a => a.walletId === wallet.id);

            if (walletAccounts.length === 0)
                continue;

            await this.websocket.send({
                type: 'User',
                userId: wallet.userId
            }, 'Wallet:BalanceUpdated', walletAccounts.map(a => ({
                account: a.name,
                balance: a.balance
            })));
        }
    }
}