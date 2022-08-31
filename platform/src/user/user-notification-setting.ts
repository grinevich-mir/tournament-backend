import { UserNotificationChannel } from './user-notification-channel';
import { UserNotificationSettingUpdate } from './user-notification-setting-update';

export interface UserNotificationSetting extends Required<UserNotificationSettingUpdate> {
    enabled: boolean;
    channel: UserNotificationChannel;
    createTime: Date;
    updateTime: Date;
}