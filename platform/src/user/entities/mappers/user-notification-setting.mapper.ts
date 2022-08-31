import { Singleton } from '../../../core/ioc';
import { UserNotificationChannel } from '../../user-notification-channel';
import { UserNotificationSetting } from '../../user-notification-setting';
import { UserNotificationSettingUpdate } from '../../user-notification-setting-update';
import { UserNotificationSettingEntity } from '../user-notification-setting.entity';

@Singleton
export class UserNotificationSettingEntityMapper {
    public fromEntity(source: UserNotificationSettingEntity): UserNotificationSetting {
        return {
            channel: source.channel,
            enabled: source.enabled,
            account: source.account,
            marketing: source.marketing,
            prize: source.prize,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public updateToEntity(userId: number, channel: UserNotificationChannel, source: UserNotificationSettingUpdate): UserNotificationSettingEntity {
        const entity = new UserNotificationSettingEntity();
        entity.userId = userId;
        entity.channel = channel;

        if (source.enabled !== undefined)
            entity.enabled = source.enabled;

        if (source.account !== undefined)
            entity.account = source.account;

        if (source.marketing !== undefined)
            entity.marketing = source.marketing;

        if (source.prize !== undefined)
            entity.prize = source.prize;

        return entity;
    }
}