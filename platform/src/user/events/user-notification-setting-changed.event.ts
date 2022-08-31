import { PlatformEvent } from '../../core/events';
import { UserNotificationSetting } from '../user-notification-setting';

export class UserNotificationSettingChangedEvent extends PlatformEvent {
    constructor(
        public readonly userId: number,
        public readonly setting: UserNotificationSetting) {
            super('User:NotificationSettingChanged');
        }
}