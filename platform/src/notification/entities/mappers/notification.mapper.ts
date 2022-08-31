import { Singleton } from '../../../core/ioc';
import { Notification, NotificationData } from '../../notification';
import { NotificationRecipient } from '../../notification-recipient';
import { NotificationType } from '../../notification-type';
import { NotificationRecipientEntity } from '../notification-recipient.entity';
import { NotificationEntity } from '../notification.entity';

@Singleton
export class NotificationEntityMapper {
    public fromEntity(source: NotificationEntity): Notification {
        return {
            id: source.id,
            type: source.type,
            data: source.data,
            read: source.recipients.every(r => !!r.readTime),
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public newToEntity(type: NotificationType, data: NotificationData): NotificationEntity {
        const entity = new NotificationEntity();
        entity.type = type;
        entity.data = data;
        return entity;
    }

    public recipientToEntity(notificationId: number, userId: number): NotificationRecipientEntity {
        const recipient = new NotificationRecipientEntity();
        recipient.notificationId = notificationId;
        recipient.userId = userId;
        return recipient;
    }

    public recipientFromEntity(source: NotificationRecipientEntity): NotificationRecipient {
        return {
            notificationId: source.notificationId,
            userId: source.userId,
            readTime: source.readTime,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}