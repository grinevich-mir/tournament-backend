import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { UserLogEntity } from '../entities/user-log.entity';
import { LogClass } from '../../core/logging';
import { Between, FindManyOptions } from 'typeorm';
import { PagedResult } from '../../core';
import { UserLogMessageFilter } from '../user-log-message-filter';

@Singleton
@LogClass()
export class UserLogRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
        }

    public async add(...entries: UserLogEntity[]): Promise<void> {
        const connection = await this.db.getConnection();
        for (const entry of entries)
            delete entry.id;

        await connection.manager.createQueryBuilder()
            .insert()
            .into(UserLogEntity)
            .values(entries)
            .updateEntity(false)
            .execute();
    }

    public async getAll(filter?: UserLogMessageFilter): Promise<PagedResult<UserLogEntity>> {

        const connection = await this.db.getConnection();

        const options: FindManyOptions<UserLogEntity> = {
            order: {
                createTime: 'DESC'
            }
        };

        if (filter) {
            options.where = {};

            if (filter.userId)
                options.where.userId = filter.userId;

            if (filter.type)
                options.where.type = filter.type;

            if (filter.originator)
                options.where.originator = filter.originator;

            if (filter.originatorId)
                options.where.originatorId = filter.originatorId;

            if (filter.application)
                options.where.application = filter.application;

            if (filter.action)
                options.where.action = filter.action;

            if(filter.createdFrom && filter.createdTo)
                options.where.createTime = Between(filter.createdFrom, filter.createdTo);

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        options.join = {
            alias: 'userLog',
            innerJoinAndSelect: {
                user: 'userLog.user'
            }
        };

        const [entities, count] = await connection.manager.findAndCount(UserLogEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }
}