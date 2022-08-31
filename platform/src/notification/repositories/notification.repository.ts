import { FindConditions, IsNull, Not } from 'typeorm';
import { PagedResult } from '../../core';
import { GlobalDB } from '../../core/db';
import { convertOrdering } from '../../core/db/orm';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { NotificationEntity } from '../entities';
import { NotificationEntityMapper } from '../entities/mappers';
import { NotificationRecipientEntity } from '../entities/notification-recipient.entity';
import { Notification, NotificationData } from '../notification';
import { NotificationFilter } from '../notification-filter';
import { NotificationType } from '../notification-type';

@Singleton
@LogClass()
export class NotificationRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: NotificationEntityMapper) {
        }

    public async get(id: number): Promise<Notification | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(NotificationEntity, id);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async add(type: NotificationType, data: NotificationData, recipients: number[]): Promise<Notification> {
        const connection = await this.db.getConnection();
        const entity = this.mapper.newToEntity(type, data);

        return connection.transaction(async manager => {
            const created = await manager.save(entity);
            const recipientEntities = recipients.map(r => this.mapper.recipientToEntity(created.id, r));
            await manager.save(recipientEntities);
            created.recipients = recipientEntities;
            return this.mapper.fromEntity(created);
        });
    }

    public async count(userId: number, read?: boolean): Promise<number> {
        const connection = await this.db.getConnection();
        const where: FindConditions<NotificationRecipientEntity> = {
            userId
        };

        if (read !== undefined)
            where.readTime = read ? Not(IsNull()) : IsNull();

        return connection.manager.count(NotificationRecipientEntity, { where });
    }

    public async getAllForUser(userId: number, filter?: NotificationFilter): Promise<PagedResult<Notification>> {
        const connection = await this.db.getConnection();
        let query = connection.createQueryBuilder(NotificationRecipientEntity, 'recipient')
            .where('recipient.userId = :userId', { userId })
            .innerJoinAndSelect('recipient.notification', 'notification')
            .addOrderBy('recipient.createTime', 'DESC');

        if (filter) {
            if (filter.type)
                query = query.andWhere('notification.type = :type', { type: filter.type });

            if (filter.read !== undefined)
                query = query.andWhere(filter.read ? 'recipient.readTime IS NOT NULL' : 'recipient.readTime IS NULL');

            if (filter.page && filter.pageSize)
                query = query.skip((filter.page - 1) * filter.pageSize).take(filter.pageSize);

            if (filter.order)
                query = query.orderBy(convertOrdering('notification', filter.order));
        }

        const [entities, count] = await query.getManyAndCount();
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;

        if (entities.length === 0)
            return new PagedResult([], count, page, pageSize);

        const notificationEntities: NotificationEntity[] = [];

        for (const recipientEntity of entities) {
            const notificationEntity = recipientEntity.notification;
            notificationEntity.recipients = [recipientEntity];
            notificationEntities.push(notificationEntity);
        }

        return new PagedResult(notificationEntities.map(e => this.mapper.fromEntity(e)), count, page, pageSize);
    }

    public async getForUser(userId: number, id: number): Promise<Notification | undefined> {
        const connection = await this.db.getConnection();
        const recipient = await connection.manager.findOne(NotificationRecipientEntity, {
            userId,
            notificationId: id
        },
        {
            relations: ['notification']
        });

        if (!recipient)
            return undefined;

        const notificationEntity = recipient.notification;
        notificationEntity.recipients = [recipient];
        return this.mapper.fromEntity(notificationEntity);
    }

    public async setAllRead(userId: number, read: boolean): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(NotificationRecipientEntity, {
            userId
        },
        {
            readTime: () => read ? 'CURRENT_TIMESTAMP' : 'null',
            updateTime: () => 'CURRENT_TIMESTAMP'
        });
    }

    public async setRead(id: number, userId: number, read: boolean): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(NotificationRecipientEntity, {
            notificationId: id,
            userId
        },
        {
            readTime: () => read ? 'CURRENT_TIMESTAMP' : 'null',
            updateTime: () => 'CURRENT_TIMESTAMP'
        });
    }

    public async removeRecipient(id: number, userId: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(NotificationRecipientEntity, {
            notificationId: id,
            userId
        });

        const recipientCount = await connection.manager.count(NotificationRecipientEntity, {
            where: {
                notificationId: id
            }
        });

        if (recipientCount > 0)
            return;

        await connection.manager.delete(NotificationEntity, id);
    }

    public async remove(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(NotificationEntity, id);
    }
}