import { Inject, Singleton } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { WalletAccountEntity } from '../entities';
import { FindManyOptions, FindConditions, FindOneOptions } from 'typeorm';
import { UserWalletAccounts } from '../user-wallet-accounts';
import { WalletAccountFilter } from '../wallet-account-filter';
import { LogClass } from '../../core/logging';
import { PagedResult } from '../../core';

@Singleton
@LogClass()
export class WalletAccountRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: WalletAccountFilter): Promise<PagedResult<WalletAccountEntity>> {
        const connection = await this.db.getConnection();
        const where: FindConditions<WalletAccountEntity> = {};
        const options: FindManyOptions<WalletAccountEntity> = {
            where,
            order: {
                id: 'ASC'
            }
        };

        if (filter) {
            if (filter.walletId)
                where.walletId = filter.walletId;

            if (filter.currencyCode)
                where.currencyCode = filter.currencyCode;

            if (filter.name)
                where.name = filter.name;

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(WalletAccountEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async get(id: number): Promise<WalletAccountEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(WalletAccountEntity, id);
    }

    public async getByName(walletId: number, name: string): Promise<WalletAccountEntity | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<WalletAccountEntity> = {
            where: {
                walletId,
                name
            }
        };
        return connection.manager.findOne(WalletAccountEntity, findOptions);
    }

    public async getForUser(userId: number, ...names: UserWalletAccounts[]): Promise<WalletAccountEntity[]> {
        const connection = await this.db.getConnection();
        return connection.createQueryBuilder(WalletAccountEntity, 'account')
            .where('account.name IN(:...names)', { names })
            .innerJoin('account.wallet', 'wallet', 'wallet.userId = :userId', { userId })
            .getMany();
    }

    public async add(...entities: WalletAccountEntity[]): Promise<WalletAccountEntity[]> {
        const connection = await this.db.getConnection();
        await connection.manager.insert(WalletAccountEntity, entities);
        return entities;
    }
}