import _ from 'lodash';
import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { UserNotificationChannel } from '../user-notification-channel';
import { UserNotificationSetting } from '../user-notification-setting';

@Singleton
export class UserNotificationSettingCache {
    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async getAll(userId: number): Promise<UserNotificationSetting[] | undefined> {
        const cacheKey = this.getCacheKey(userId);

        if (!await this.redis.cluster.exists(cacheKey))
            return undefined;

        const rawSettings = await this.redis.cluster.hvals(cacheKey);

        if (rawSettings.length === 0)
            return [];

        return rawSettings.map(s => this.serialiser.deserialise(s));
    }

    public async get(userId: number, channel: UserNotificationChannel): Promise<UserNotificationSetting | undefined> {
        const cacheKey = this.getCacheKey(userId);

        const rawSetting = await this.redis.cluster.hget(cacheKey, channel);

        if (!rawSetting)
            return undefined;

        return this.serialiser.deserialise(rawSetting);
    }

    public async store(userId: number, ...settings: UserNotificationSetting[]): Promise<void> {
        const cacheKey = this.getCacheKey(userId);
        const data = _.chain(settings)
            .keyBy(s => s.channel)
            .mapValues(d => this.serialiser.serialise(d))
            .value();

        await this.redis.cluster.hmset(cacheKey, data);
    }

    private getCacheKey(userId: number): string {
        const cacheKeyGenerator = new CacheKeyGenerator('USERS');
        return cacheKeyGenerator.generate(userId, 'Settings', 'Notifications');
    }
}