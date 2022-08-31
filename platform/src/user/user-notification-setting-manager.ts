import _ from 'lodash';
import { PlatformEventDispatcher } from '../core/events';
import { Inject, Singleton } from '../core/ioc';
import { UserNotificationSettingCache } from './cache';
import { UserNotificationSettingChangedEvent } from './events';
import { UserNotificationSettingRepository } from './repositories';
import { UserNotificationChannel } from './user-notification-channel';
import { UserNotificationSetting } from './user-notification-setting';
import { UserNotificationSettingUpdate } from './user-notification-setting-update';

@Singleton
export class UserNotificationSettingManager {
    constructor(
        @Inject private readonly repository: UserNotificationSettingRepository,
        @Inject private readonly cache: UserNotificationSettingCache,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {}

    public async getAll(userId: number): Promise<UserNotificationSetting[]> {
        const defaults = this.getDefaults();
        const cached = await this.cache.getAll(userId);

        if (cached)
            return cached;

        let settings = await this.repository.getAll(userId);

        settings = _.chain(defaults)
            .keyBy(d => d.channel)
            .merge(_.keyBy(settings, s => s.channel))
            .values()
            .value();

        settings = _.sortBy(_.unionBy(settings, defaults, 'type'), 'type');
        await this.cache.store(userId, ...settings);
        return settings;
    }

    public async get(userId: number, channel: UserNotificationChannel): Promise<UserNotificationSetting | undefined> {
        const cached = await this.cache.get(userId, channel);

        if (cached)
            return cached;

        const settings = await this.getAll(userId);
        return settings.find(s => s.channel === channel);
    }


    public async set(userId: number, channel: UserNotificationChannel, update: UserNotificationSettingUpdate): Promise<void> {
        const saved = await this.repository.set(userId, channel, update);
        await this.cache.store(userId, saved);
        await this.eventDispatcher.send(new UserNotificationSettingChangedEvent(userId, saved));
    }

    private getDefaults(): UserNotificationSetting[] {
        return Object.keys(UserNotificationChannel)
            .map(key => this.getDefault(key as UserNotificationChannel));
    }

    private getDefault(channel: UserNotificationChannel): UserNotificationSetting {
        return {
            enabled: true,
            channel,
            account: true,
            prize: true,
            marketing: true,
            createTime: new Date(),
            updateTime: new Date()
        };
    }
}