import { Inject, Singleton } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { WalletTransactionEntity } from '../entities';
import { convertOrdering } from '../../core/db/orm';
import { WalletTransactionFilter } from '../wallet-transaction-filter';
import { LogClass } from '../../core/logging';
import { PagedResult } from '../../core';

@Singleton
@LogClass()
export class WalletTransactionRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: WalletTransactionFilter): Promise<PagedResult<WalletTransactionEntity>> {
        const connection = await this.db.getConnection();
        let query = connection.createQueryBuilder(WalletTransactionEntity, 'transaction');

        if (filter) {
            if (filter.accountId && filter.accounts)
                delete filter.accounts;

            if (filter.purpose)
                query = query.andWhere('transaction.purpose = :purpose', { purpose: filter.purpose });

            if (filter.from)
                query = query.andWhere('transaction.createTime >= :from', { from: filter.from });

            if (filter.to)
                query = query.andWhere('transaction.createTime <= :to', { to: filter.to });

            if (filter.currencyCode)
                query = query.andWhere('transaction.currencyCode = :currencyCode', { currencyCode: filter.currencyCode });

            if (filter.page && filter.pageSize) {
                query = query.skip((filter.page - 1) * filter.pageSize);
                query = query.take(filter.pageSize);
            }

            if (filter.accountId)
                query = query.innerJoin('transaction.account', 'account');

            if (filter.walletId)
                query = query.innerJoin('transaction.wallet', 'wallet');

            if (filter.accountId)
                query = query.andWhere('account.id = :accountId', { accountId: filter.accountId });

            if (filter.accounts && filter.accounts.length > 0)
                query = query.andWhere('account.name IN(:accounts)', { accounts: filter.accounts });

            if (filter.walletId)
                query = query.andWhere('wallet.id = :walletId', { walletId: filter.walletId });

            if (filter.order)
                query = query.orderBy(convertOrdering('transaction', filter.order));
        }

        const [entities, count] = await query.getManyAndCount();
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async get(id: number): Promise<WalletTransactionEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(WalletTransactionEntity, id);
    }
}