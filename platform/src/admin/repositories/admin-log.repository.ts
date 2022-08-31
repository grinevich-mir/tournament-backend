import { Singleton, Inject } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { GlobalDB } from '../../core/db';
import { Between, FindManyOptions } from 'typeorm';
import { PagedResult } from '../../core';
import { AdminLogEntity } from '../entities';
import { AdminLogMessageFilter } from '../admin-log-message-filter';

@Singleton
@LogClass()
export class AdminLogRepository {
    constructor(@Inject private readonly db: GlobalDB) { }

    public async getAll(filter?: AdminLogMessageFilter): Promise<PagedResult<AdminLogEntity>> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<AdminLogEntity> = {
            order: {
                createTime: 'DESC'
            }
        };

        if (filter) {
            options.where = {};

            if (filter.userId)
                options.where.userId = filter.userId;

            if (filter.createdFrom && filter.createdTo)
                options.where.createTime = Between(filter.createdFrom, filter.createdTo);

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(AdminLogEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async add(entry: AdminLogEntity): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.save(entry);
    }

}