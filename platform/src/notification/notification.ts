import { NotificationType } from './notification-type';

export interface NotificationData {
    [key: string]: any;
}

export interface Notification {
    id: number;
    type: NotificationType;
    data: NotificationData;
    read: boolean;
    createTime: Date;
    updateTime: Date;
}