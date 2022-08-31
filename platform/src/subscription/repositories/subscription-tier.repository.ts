import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { SubscriptionTierEntity } from '../entities';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { SubscriptionTierFilter } from '../subscription-tier-filter';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class SubscriptionTierRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
        }

    public async getAll(filter?: SubscriptionTierFilter): Promise<SubscriptionTierEntity[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<SubscriptionTierEntity> = {
            relations: ['variants', 'variants.prices']
        };

        if (filter) {
            options.where = {};

            if (filter.enabled)
                options.where.enabled = filter.enabled;

            if (filter.skinId)
                options.where.skinId = filter.skinId;
        }

        return connection.manager.find(SubscriptionTierEntity, options);
    }

    public async get(id: number): Promise<SubscriptionTierEntity | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<SubscriptionTierEntity> = {
            relations: ['variants', 'variants.prices']
        };
        return connection.manager.findOne(SubscriptionTierEntity, id, findOptions);
    }

    public async getByCode(skinId: string, code: string): Promise<SubscriptionTierEntity | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<SubscriptionTierEntity> = {
            relations: ['variants', 'variants.prices'],
            where: {
                code,
                skinId
            }
        };

        return connection.manager.findOne(SubscriptionTierEntity, findOptions);
    }

    public async getByLevel(skinId: string, level: number): Promise<SubscriptionTierEntity | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<SubscriptionTierEntity> = {
            relations: ['variants', 'variants.prices'],
            where: {
                level,
                skinId
            }
        };

        return connection.manager.findOne(SubscriptionTierEntity, findOptions);
    }
}