import { PagedFilter } from '../core';
import { Notification } from './notification';
import { NotificationType } from './notification-type';

export interface NotificationFilter extends PagedFilter<Notification> {
    type?: NotificationType;
    read?: boolean;
}