import { Inject, Singleton } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { FindManyOptions, Raw, FindOneOptions } from 'typeorm';
import { UpgradeEntity, ScheduledUpgradeEntity, SubscriptionUpgradeEntity } from '../entities';
import { UpgradeStatus } from '../upgrade-status';
import { LogClass } from '../../core/logging';
import { PagedResult } from '../../core';
import { UpgradeFilter } from '../upgrade-filter';

@Singleton
@LogClass()
export class UpgradeRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: UpgradeFilter): Promise<PagedResult<UpgradeEntity>> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<UpgradeEntity> = {};

        if (filter) {
            options.where = {};

            if (filter.userId)
                options.where.userId = filter.userId;

            if (filter.type)
                options.where.type = filter.type;

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }
        }

        const [entities, count] = await connection.manager.findAndCount(UpgradeEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async get(id: number): Promise<UpgradeEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(UpgradeEntity, id);
    }

    public async getStarted(count?: number): Promise<ScheduledUpgradeEntity[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<ScheduledUpgradeEntity> = {
            where: {
                status: UpgradeStatus.Pending,
                startTime: Raw((alias) => `${alias} <= CURRENT_TIMESTAMP`)
            }
        };

        if (count)
            options.take = count;

        return connection.manager.find(ScheduledUpgradeEntity, options);
    }

    public async getEnded(count?: number): Promise<ScheduledUpgradeEntity[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<ScheduledUpgradeEntity> = {
            where: {
                status: UpgradeStatus.Active,
                endTime: Raw((alias) => `${alias} <= CURRENT_TIMESTAMP`)
            }
        };

        if (count)
            options.take = count;

        return connection.manager.find(ScheduledUpgradeEntity, options);
    }

    public async getBySubscriptionId(id: number): Promise<SubscriptionUpgradeEntity | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<SubscriptionUpgradeEntity> =  {
            where: {
                subscriptionId: id
            }
        };
        return connection.manager.findOne(SubscriptionUpgradeEntity, findOptions);
    }

    public async getActiveSubscription(userId: number): Promise<SubscriptionUpgradeEntity | undefined> {
        const connection = await this.db.getConnection();
        const findOptions: FindOneOptions<SubscriptionUpgradeEntity> =  {
            where: {
                userId,
                status: UpgradeStatus.Active
            },
            order: {
                updateTime: 'DESC',
                createTime: 'DESC'
            }
        };
        return connection.manager.findOne(SubscriptionUpgradeEntity, findOptions);
    }

    public async addSubscription(entity: SubscriptionUpgradeEntity): Promise<SubscriptionUpgradeEntity> {
        const connection = await this.db.getConnection();
        delete entity.id;
        return connection.manager.save(SubscriptionUpgradeEntity, entity);
    }

    public async addScheduled(entity: ScheduledUpgradeEntity): Promise<ScheduledUpgradeEntity> {
        const connection = await this.db.getConnection();
        delete entity.id;
        return connection.manager.save(ScheduledUpgradeEntity, entity);
    }

    public async setStatus(id: number, status: UpgradeStatus): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UpgradeEntity, id, { status });
    }

    public async setLevel(id: number, level: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UpgradeEntity, id, { level });
    }

    public async getMaxActiveLevel(userId: number): Promise<number> {
        const connection = await this.db.getConnection();
        const result = await connection.createQueryBuilder(UpgradeEntity, 'upgrade')
            .select('upgrade.level')
            .where('upgrade.userId = :userId', { userId })
            .andWhere('upgrade.status = :status', { status: UpgradeStatus.Active })
            .orderBy('upgrade.level', 'DESC')
            .getOne();

        if (!result)
            return 0;

        return result.level;
    }
}