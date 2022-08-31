import { WalletAccountRepository } from './repositories';
import { Inject, Singleton } from '../core/ioc';
import { WalletAccountFilter } from './wallet-account-filter';
import { WalletAccountEntityMapper } from './entities/mappers';
import { WalletAccount } from './wallet-account';
import { UserWalletAccounts } from './user-wallet-accounts';
import { WalletAccountEntity } from './entities';
import { LogClass } from '../core/logging';
import { PagedResult } from '../core';

// TODO: Add caching?
@Singleton
@LogClass()
export class WalletAccountManager {
    constructor(
        @Inject private readonly repository: WalletAccountRepository,
        @Inject private readonly entityMapper: WalletAccountEntityMapper) {
        }

    public async getAll(filter?: WalletAccountFilter): Promise<PagedResult<WalletAccount>> {
        const result = await this.repository.getAll(filter);
        const accounts = result.items.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(accounts, result.totalCount, result.page, result.pageSize);
    }

    public async get(id: number): Promise<WalletAccount | undefined> {
        const entity = await this.repository.get(id);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async getByName(walletId: number, name: string): Promise<WalletAccount | undefined> {
        const entity = await this.repository.getByName(walletId, name);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async getForUser(userId: number, name: UserWalletAccounts): Promise<WalletAccount | undefined> {
        const accounts = await this.getManyForUser(userId, name);

        if (accounts.length === 0)
            return undefined;

        return accounts[0];
    }

    public async getManyForUser(userId: number, ...names: UserWalletAccounts[]): Promise<WalletAccount[]> {
        const entities = await this.repository.getForUser(userId, ...names);

        if (!entities)
            return [];

        return entities.map(e => this.entityMapper.fromEntity(e));
    }

    public async addPlatformCurrency(walletId: number, currencyCode: string, allowNegative?: boolean): Promise<WalletAccount> {
        const entity = new WalletAccountEntity();
        entity.walletId = walletId;
        entity.name = currencyCode;
        entity.currencyCode = currencyCode;

        if (allowNegative !== undefined)
            entity.allowNegative = allowNegative;

        await this.repository.add(entity);
        return this.entityMapper.fromEntity(entity);
    }

    public async addUserDefaults(walletId: number, currencyCode?: string): Promise<void> {
        const currentAccounts = await this.getAll({ walletId });

        const newAccounts: WalletAccountEntity[] = [];

        const defaults = this.createDefaultUserAccounts(walletId, currencyCode);

        for (const acc of defaults) {
            if (currentAccounts.items.find(a => a.name === acc.name))
                continue;

            newAccounts.push(acc);
        }

        if (newAccounts.length > 0)
            await this.repository.add(...newAccounts);
    }

    private createDefaultUserAccounts(walletId: number, currencyCode?: string): WalletAccountEntity[] {
        const accounts: WalletAccountEntity[] = [];

        const diamondAccount = new WalletAccountEntity();
        diamondAccount.walletId = walletId;
        diamondAccount.name = UserWalletAccounts.Diamonds;
        diamondAccount.currencyCode = 'DIA';
        accounts.push(diamondAccount);

        if (currencyCode)
            for (const name of Object.keys(UserWalletAccounts).filter(n => n !== UserWalletAccounts.Diamonds)) {
                const account = new WalletAccountEntity();
                account.walletId = walletId;
                account.name = name;
                account.currencyCode = currencyCode;
                account.allowNegative = false;
                accounts.push(account);
            }

        return accounts;
    }
}