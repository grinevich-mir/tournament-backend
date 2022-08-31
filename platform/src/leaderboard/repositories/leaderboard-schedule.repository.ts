import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { LeaderboardScheduleEntity, LeaderboardScheduleItemEntity } from '../entities';
import { PagedResult, ConflictError } from '../../core';
import { FindManyOptions, Raw } from 'typeorm';
import _ from 'lodash';
import { LogClass } from '../../core/logging';
import { LeaderboardScheduleFilter } from '../leaderboard-schedule-filter';
import { LeaderboardScheduleItemFilter } from '../leaderboard-schedule-item-filter';

@Singleton
@LogClass()
export class LeaderboardScheduleRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: LeaderboardScheduleFilter): Promise<LeaderboardScheduleEntity[]> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<LeaderboardScheduleEntity> = {
            relations: ['prizes']
        };

        if (filter) {
            options.where = {};

            if (filter.enabled !== undefined)
                options.where.enabled = filter.enabled;

            if (filter.frequency)
                options.where.frequency = filter.frequency;
        }

        return connection.manager.find(LeaderboardScheduleEntity, options);
    }

    public async get(name: string): Promise<LeaderboardScheduleEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(LeaderboardScheduleEntity, name, {
            relations: ['prizes']
        });
    }

    public async exists(name: string): Promise<boolean> {
        const connection = await this.db.getConnection();
        const count = await connection.manager.count(LeaderboardScheduleEntity, {
            where: {
                name
            }
        });

        return count > 0;
    }

    public async add(entity: LeaderboardScheduleEntity): Promise<LeaderboardScheduleEntity> {
        const connection = await this.db.getConnection();

        if (await this.exists(entity.name))
            throw new ConflictError(`A leaderboard schedule named '${entity.name}' already exists.`);

        await connection.manager.save(LeaderboardScheduleEntity, entity);
        return await this.get(entity.name) as LeaderboardScheduleEntity;
    }

    public async update(entity: LeaderboardScheduleEntity): Promise<LeaderboardScheduleEntity> {
        const connection = await this.db.getConnection();

        if (!await this.exists(entity.name))
            throw new ConflictError(`A leaderboard schedule named '${entity.name}' does not exist.`);

        await connection.manager.save(LeaderboardScheduleEntity, entity);
        return await this.get(entity.name) as LeaderboardScheduleEntity;
    }

    public async getItems(scheduleName: string, filter?: LeaderboardScheduleItemFilter): Promise<PagedResult<LeaderboardScheduleItemEntity>> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<LeaderboardScheduleItemEntity> = {
            order: {
                createTime: 'DESC'
            }
        };

        options.where = {
            scheduleName
        };

        if (filter) {
            if (filter.enabled !== undefined)
                options.where.enabled = filter.enabled;

            if (filter.finalised !== undefined)
                options.where.finalised = filter.finalised;

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }
        }

        const [entities, count] = await connection.manager.findAndCount(LeaderboardScheduleItemEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async getLastItem(scheduleName: string): Promise<LeaderboardScheduleItemEntity | undefined> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<LeaderboardScheduleItemEntity> = {
            where: {
                scheduleName
            },
            order: {
                endTime: 'DESC'
            }
        };

        return connection.manager.findOne(LeaderboardScheduleItemEntity, options);
    }

    public async getCurrentItem(scheduleName: string): Promise<LeaderboardScheduleItemEntity | undefined> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<LeaderboardScheduleItemEntity> = {
            where: {
                scheduleName,
                startTime: Raw(alias => `CURRENT_TIMESTAMP >= ${alias}`),
                endTime: Raw(alias => `CURRENT_TIMESTAMP < ${alias}`),
                enabled: true
            }
        };

        return connection.manager.findOne(LeaderboardScheduleItemEntity, options);
    }

    public async getCurrentItems(context?: Date): Promise<LeaderboardScheduleItemEntity[]> {
        const connection = await this.db.getConnection();
        const dateStr = context ? `'${context.toISOString()}'` : 'CURRENT_TIMESTAMP';
        const options: FindManyOptions<LeaderboardScheduleItemEntity> = {
            where: {
                startTime: Raw(alias => `${dateStr} >= ${alias}`),
                endTime: Raw(alias => `${dateStr} < ${alias}`),
                enabled: true,
                finalised: false
            }
        };

        return connection.manager.find(LeaderboardScheduleItemEntity, options);
    }

    public async getEndedItems(finalised?: boolean): Promise<LeaderboardScheduleItemEntity[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<LeaderboardScheduleItemEntity> = {};
        options.where = {
            endTime: Raw(alias => `CURRENT_TIMESTAMP >= ${alias}`),
            enabled: true
        };

        if (finalised !== undefined)
            options.where.finalised = finalised;

        return connection.manager.find(LeaderboardScheduleItemEntity, options);
    }

    public async getItem(id: number): Promise<LeaderboardScheduleItemEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(LeaderboardScheduleItemEntity, id);
    }

    public async addItem(entity: LeaderboardScheduleItemEntity): Promise<LeaderboardScheduleItemEntity> {
        const connection = await this.db.getConnection();
        delete (entity as any).id;
        return connection.manager.save(LeaderboardScheduleItemEntity, entity);
    }

    public async finaliseItem(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(LeaderboardScheduleItemEntity, id, {
            finalised: true
        });
    }
}