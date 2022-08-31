import { Inject, Singleton } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { WalletEntity, PlatformWalletEntity, UserWalletEntity } from '../entities';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { WalletFlow } from '../wallet-flow';
import { PlatformWallets } from '../platform-wallets';
import { WalletType } from '../wallet-type';
import { WalletFilter } from '../wallet-filter';
import { LogClass } from '../../core/logging';
import { PagedResult } from '../../core';

@Singleton
@LogClass()
export class WalletRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: WalletFilter): Promise<PagedResult<WalletEntity>> {
        const connection = await this.db.getConnection();
        const where: any = {};
        const options: FindManyOptions<PlatformWalletEntity | UserWalletEntity> = { where };

        if (filter) {
            if (filter.type) {
                where.type = filter.type;

                if (filter.type === WalletType.Platform && filter.name)
                    where.name = filter.name;

                if (filter.type === WalletType.User && filter.userId)
                    where.userId = filter.userId;
            }

            if (filter.flow)
                where.flow = filter.flow;

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(WalletEntity, options as unknown as FindManyOptions<WalletEntity>);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async get(id: number): Promise<WalletEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(WalletEntity, id);
    }

    public async getForUser(userId: number): Promise<UserWalletEntity | undefined> {
        const connection = await this.db.getConnection();
        const query = connection.createQueryBuilder(UserWalletEntity, 'wallet')
            .where('wallet.userId = :userId', { type: WalletType.User, userId });
        return query.getOne();
    }

    public async getForPlatform(wallet: PlatformWallets): Promise<PlatformWalletEntity | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<PlatformWalletEntity> = {
            where: {
                name: wallet
            }
        };

        return connection.manager.findOne(PlatformWalletEntity, findOptions);
    }

    public async addForUser(userId: number): Promise<UserWalletEntity> {
        const connection = await this.db.getConnection();
        const wallet = new UserWalletEntity();
        wallet.flow = WalletFlow.All;
        wallet.userId = userId;

        const result = await connection.manager.insert(UserWalletEntity, wallet);
        const walletId = Number(result.identifiers[0].id);
        wallet.id = walletId;
        return wallet;
    }

    public async addForPlatform(name: string, flow: WalletFlow = WalletFlow.All): Promise<PlatformWalletEntity> {
        const connection = await this.db.getConnection();
        const wallet = new PlatformWalletEntity();
        wallet.flow = flow;
        wallet.name = name;

        const result = await connection.manager.insert(PlatformWalletEntity, wallet);
        const walletId = Number(result.identifiers[0].id);
        wallet.id = walletId;
        return wallet;
    }
}
