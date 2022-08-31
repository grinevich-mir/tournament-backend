import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { WithdrawalRequestEntity } from '../entities';
import { FindManyOptions, In } from 'typeorm';
import { WithdrawalRequestStatus } from '../withdrawal-request-status';
import { WithdrawalRequestFilter } from '../withdrawal-request-filter';
import { PagedResult } from '../../core';

@Singleton
export class WithdrawalRequestRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
        }

    public async getAll(filter?: WithdrawalRequestFilter): Promise<PagedResult<WithdrawalRequestEntity>> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<WithdrawalRequestEntity> = {
            order: {
                createTime: 'DESC'
            }
        };

        if (filter) {
            options.where = {};

            if (filter.userId)
                options.where.userId = filter.userId;

            if (filter.status)
                options.where.status = filter.status;

            if (filter.provider)
                options.where.provider = filter.provider;

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(WithdrawalRequestEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async get(id: string): Promise<WithdrawalRequestEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(WithdrawalRequestEntity, id);
    }

    public async getMany(...ids: string[]): Promise<WithdrawalRequestEntity[]> {
        const connection = await this.db.getConnection();
        return connection.manager.find(WithdrawalRequestEntity, {
            where: {
                id: In(ids)
            }
        });
    }

    public async add(entity: WithdrawalRequestEntity): Promise<WithdrawalRequestEntity> {
        const connection = await this.db.getConnection();
        delete entity.id;
        return connection.manager.save(entity);
    }

    public async setStatus(id: string, status: WithdrawalRequestStatus): Promise<void> {
        const connection = await this.db.getConnection();
        const update: Partial<WithdrawalRequestEntity> = {
            status
        };

        if (status === WithdrawalRequestStatus.Complete)
            update.completionTime = new Date();

        await connection.manager.update(WithdrawalRequestEntity, id, update);
    }
}