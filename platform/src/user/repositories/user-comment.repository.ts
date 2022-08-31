import { GlobalDB } from '../../core/db';
import { Singleton, Inject } from '../../core/ioc';
import { UserCommentEntity } from '../entities';
import { LogClass } from '../../core/logging';
import { FindManyOptions } from 'typeorm';
import { UserCommentFilter } from '../user-comment-filter';
import { PagedResult } from '../../core';

@Singleton
@LogClass()
export class UserCommentRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: UserCommentFilter): Promise<PagedResult<UserCommentEntity>> {
        const connection = await this.db.getConnection();
        const where: any = {};
        const options: FindManyOptions<UserCommentEntity> = {where};

        if (filter) {
            if (filter.userId)
                where.userId = filter.userId;

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }
        }

        const [entities, count] = await connection.manager.findAndCount(UserCommentEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async add(entity: UserCommentEntity): Promise<UserCommentEntity> {
        const connection = await this.db.getConnection();
        return connection.manager.save(UserCommentEntity, entity);
    }

    public async update(entity: UserCommentEntity): Promise<void> {
        const connect = await this.db.getConnection();
        await connect.manager.update(UserCommentEntity, entity.id, entity);
    }

}
