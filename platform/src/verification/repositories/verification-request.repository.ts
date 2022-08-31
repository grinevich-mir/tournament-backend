import { Inject, Singleton } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { FindOneOptions, Raw } from 'typeorm';
import { VerificationAttachmentEntity, VerificationRequestEntity } from '../entities';
import { VerificationRequestState } from '../verification-request-state';
import { VerificationAttachmentState } from '../verification-attachment-state';
import { PagedResult } from '../../core';
import { LogClass } from '../../core/logging';
import { VerificationRequestFilter } from '../verification-request-filter';
import { VerificationRequestEntityMapper } from '../entities/mappers';
import { VerificationRequest } from '../verification-request';
import { VerificationAttachment } from '../verification-attachment';
import { convertOrdering } from '../../core/db/orm';

@Singleton
@LogClass()
export class VerificationRequestRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly entityMapper: VerificationRequestEntityMapper) {
    }

    public async exists(id: string): Promise<boolean> {
        if (!id)
            throw new Error('id missing.');

        const connection = await this.db.getConnection();
        const count = await connection.manager.count(VerificationRequestEntity, { where: { id } });
        return count > 0;
    }

    public async getAll(filter?: VerificationRequestFilter): Promise<PagedResult<VerificationRequest>> {
        const connection = await this.db.getConnection();
        let query = connection.createQueryBuilder(VerificationRequestEntity, 'verification')
            .innerJoinAndSelect('verification.user', 'user', 'verification.userId = user.id')
            .innerJoinAndSelect('verification.attachments', 'attachment');

        if (filter) {
            if (filter.userId)
                query = query.andWhere('verification.userId = :userId', { userId: filter.userId });

            if (filter.states && filter.states.length > 0)
                query = query.andWhere('verification.state IN(:states)', { states: filter.states });

            if (filter.fields?.displayName)
                query = query.andWhere(`user.displayName LIKE :displayName`, { displayName: `%${filter.fields.displayName}%` });

            if (filter.fields?.level !== undefined)
                query = query.andWhere(`user.level = :level`, { level: filter.fields.level });

            if (filter.expired !== undefined)
                if (filter.expired === false)
                    query = query.andWhere('verification.expireTime > CURRENT_TIMESTAMP');
                else
                    query = query.andWhere('verification.expireTime <= CURRENT_TIMESTAMP');

            if (filter.page && filter.pageSize) {
                query = query.skip((filter.page - 1) * filter.pageSize);
                query = query.take(filter.pageSize);
            }

            if (filter.order)
                query = query.orderBy(convertOrdering('verification', filter.order));
        }

        const [entities, count] = await query.getManyAndCount();
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        const requests = entities.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(requests, count, page, pageSize);
    }

    public async get(id: string): Promise<VerificationRequest | undefined> {
        if (!id)
            throw new Error('id missing.');

        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(VerificationRequestEntity, id, {
            relations: ['user', 'attachments']
        });

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async getByUserId(userId: number): Promise<VerificationRequest | undefined> {
        if (!userId)
            throw new Error('user id missing.');

        const connection = await this.db.getConnection();

        const options: FindOneOptions<VerificationRequestEntity> = {
            relations: ['user', 'attachments'],
            where: {
                userId,
                expireTime: Raw((alias) => `${alias} > CURRENT_TIMESTAMP`)
            },
            order: {
                createTime: 'DESC'
            }
        };

        const entity = await connection.manager.findOne(VerificationRequestEntity, options);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async add(entity: VerificationRequestEntity): Promise<VerificationRequest> {
        const connection = await this.db.getConnection();
        delete (entity as any).id;
        const created = await connection.manager.save(VerificationRequestEntity, entity);
        return await this.get(created.id) as VerificationRequest;
    }

    public async setState(id: string, state: VerificationRequestState): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(VerificationRequestEntity, id, { state });
    }

    public async addAttachment(entity: VerificationAttachmentEntity): Promise<VerificationAttachment> {
        const connection = await this.db.getConnection();
        delete (entity as any).id;
        const created = await connection.manager.save(VerificationAttachmentEntity, entity);
        return this.entityMapper.attachmentFromEntity(created);
    }

    public async getAttachment(id: string): Promise<VerificationAttachment | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(VerificationAttachmentEntity, id);

        if (!entity)
            return undefined;

        return this.entityMapper.attachmentFromEntity(entity);
    }

    public async setAttachmentState(id: string, state: VerificationAttachmentState): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(VerificationAttachmentEntity, id, { state });
    }
}
