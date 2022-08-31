import { PagedResult } from '../core';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { Websocket } from '../websocket';
import { Notification, NotificationData } from './notification';
import { NotificationFilter } from './notification-filter';
import { NotificationType } from './notification-type';
import { NotificationRepository } from './repositories';

@Singleton
@LogClass()
export class NotificationManager {
    constructor(
        @Inject private readonly repository: NotificationRepository,
        @Inject private readonly websocket: Websocket) {
    }

    public async getAllForUser(userId: number, filter?: NotificationFilter): Promise<PagedResult<Notification>> {
        return this.repository.getAllForUser(userId, filter);
    }

    public async add(type: NotificationType, data: NotificationData, ...recipients: number[]): Promise<Notification> {
        const notification = await this.repository.add(type, data, recipients);

        await this.websocket.send<Notification>({
            type: 'Users',
            userIds: recipients
        },
        'Notification:Added',
        notification);

        return notification;
    }

    public async getForUser(userId: number, id: number): Promise<Notification | undefined> {
        return this.repository.getForUser(userId, id);
    }

    public async count(userId: number, read?: boolean): Promise<number> {
        return this.repository.count(userId, read);
    }

    public async setAllRead(userId: number, read: boolean): Promise<void> {
        await this.repository.setAllRead(userId, read);
    }

    public async setRead(id: number, userId: number, read: boolean): Promise<void> {
        await this.repository.setRead(id, userId, read);
    }

    public async removeRecipient(id: number, userId: number): Promise<void> {
        await this.repository.removeRecipient(id, userId);
    }

    public async remove(id: number): Promise<void> {
        await this.remove(id);
    }
}