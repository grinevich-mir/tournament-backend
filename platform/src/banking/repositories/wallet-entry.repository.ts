import { Inject, Singleton } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { WalletEntryEntity } from '../entities';
import { WalletEntryFilter } from '../wallet-entry-filter';
import { LogClass } from '../../core/logging';
import { PagedResult } from '../../core';
import { convertOrdering } from '../../core/db/orm';

@Singleton
@LogClass()
export class WalletEntryRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: WalletEntryFilter): Promise<PagedResult<WalletEntryEntity>> {
        const connection = await this.db.getConnection();
        let query = connection.createQueryBuilder(WalletEntryEntity, 'entry');

        if (filter) {
            if (filter.accountId && filter.walletId)
                delete filter.walletId;

            if (filter.purpose)
                query = query.andWhere('entry.purpose = :purpose', { purpose: filter.purpose });

            if (filter.from)
                query = query.andWhere('entry.createTime >= :from', { from: filter.from });

            if (filter.to)
                query = query.andWhere('entry.createTime <= :to', { to: filter.to });

            if (filter.page && filter.pageSize) {
                query = query.skip((filter.page - 1) * filter.pageSize);
                query = query.take(filter.pageSize);
            }

            if (filter.accountId)
                query = query.innerJoin('entry.accounts', 'accountCheck', 'accountCheck.id = :accountId', { accountId: filter.accountId });

            if (filter.walletId)
                query = query.innerJoin('entry.wallets', 'walletCheck', 'walletCheck.id = :walletId', { walletId: filter.walletId });

            if (filter.order)
                query = query.orderBy(convertOrdering('entry', filter.order));
        }

        const [entities, count] = await query.getManyAndCount();
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async get(id: number): Promise<WalletEntryEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(WalletEntryEntity, id, {
            relations: ['transactions']
        });
    }
}