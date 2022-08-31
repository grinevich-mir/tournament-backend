import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { FindManyOptions, Raw, FindOneOptions } from 'typeorm';
import { SubscriptionPromoEntity, SubscriptionPromoUsageEntity } from '../entities';
import { SubscriptionPromoFilter, SubscriptionPromoUsageFilter } from '../subscription-promo-filter';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class SubscriptionPromoRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
        }

    public async getAll(filter?: SubscriptionPromoFilter): Promise<SubscriptionPromoEntity[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<SubscriptionPromoEntity> = {};

        if (filter) {
            options.where = {};

            if (filter.skinId)
                options.where.skinId = filter.skinId;

            if (filter.enabled)
                options.where.enabled = filter.enabled;

            if (filter.skip)
                options.skip = filter.skip;

            if (filter.take)
                options.take = filter.take;
        }

        return connection.manager.find(SubscriptionPromoEntity, options);
    }

    public async getCurrent(skinId: string): Promise<SubscriptionPromoEntity | undefined> {
        const connection = await this.db.getConnection();
        const options: FindOneOptions<SubscriptionPromoEntity> = {
            where: {
                skinId,
                enabled: true
            }
        };

        return connection.manager.findOne(SubscriptionPromoEntity, options);
    }

    public async getAllUsages(filter?: SubscriptionPromoUsageFilter): Promise<SubscriptionPromoUsageEntity[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<SubscriptionPromoUsageEntity> = {};

        if (filter) {
            options.where = {};

            if (filter.subscriptionId)
                options.where.subscriptionId = filter.subscriptionId;
            else if (filter.userId)
                options.where.userId = filter.userId;

            if (filter.expired !== undefined)
                if (filter.expired)
                    options.where.expireTime = Raw((alias) => `${alias} <= CURRENT_TIMESTAMP`);
                else
                    options.where.expireTime = Raw((alias) => `${alias} > CURRENT_TIMESTAMP`);

            if (filter.skip)
                options.skip = filter.skip;

            if (filter.take)
                options.take = filter.take;
        }

        return connection.manager.find(SubscriptionPromoUsageEntity, options);
    }

    public async usageActiveForUser(userId: number): Promise<boolean> {
        const connection = await this.db.getConnection();
        const count = await connection.createQueryBuilder(SubscriptionPromoUsageEntity, 'usage')
            .select('id')
            .where('usage.userId = :userId', { userId })
            .andWhere('usage.expireTime > CURRENT_TIMESTAMP')
            .getCount();

        return count > 0;
    }

    public async addUsage(entity: SubscriptionPromoUsageEntity): Promise<SubscriptionPromoUsageEntity> {
        const connection = await this.db.getConnection();
        delete (entity as any).id;
        return connection.manager.save(SubscriptionPromoUsageEntity, entity);
    }
}