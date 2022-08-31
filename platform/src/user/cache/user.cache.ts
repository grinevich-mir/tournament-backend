import { Singleton, Inject } from '../../core/ioc';
import { JsonSerialiser, Redis } from '../../core';
import { User } from '../user';
import { CacheKeyGenerator } from '../../core/cache';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class UserCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('USERS');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async get(id: number | string): Promise<User | undefined> {
        if (typeof id === 'string') {
            const userId = await this.getId(id);

            if (!userId)
                return undefined;

            id = userId;
        }

        const cacheKey = this.cacheKeyGenerator.generate(id);
        const rawItem = await this.redis.cluster.get(cacheKey);

        if (!rawItem)
            return undefined;

        const user = this.serialiser.deserialise<User>(rawItem);

        if (user.displayName) {
            const exists = await this.displayNameExists(user.displayName);
            if (!exists)
                await this.storeDisplayName(user.displayName);
        }

        return user;
    }

    public async isOnline(id: number): Promise<boolean> {
        const cacheKey = this.cacheKeyGenerator.generate(id, 'Online');
        return await this.redis.cluster.exists(cacheKey) > 0;
    }

    public async setOnline(id: number, online: boolean): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate(id, 'Online');

        if (online) {
            await this.redis.cluster.set(cacheKey, Date.now(), 'EX', 120);
            return;
        }

        await this.redis.cluster.del(cacheKey);
    }

    public async exists(id: number | string): Promise<boolean> {
        if (typeof id === 'string')
            return await this.getId(id) !== undefined;

        const cacheKey = this.cacheKeyGenerator.generate(id);
        return await this.redis.cluster.exists(cacheKey) > 0;
    }

    public async store(user: User): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate(user.id);
        await this.redis.cluster.set(cacheKey, this.serialiser.serialise(user));
        const secureIdCacheKey = this.cacheKeyGenerator.generate('SecureId-Id', user.secureId);
        await this.redis.cluster.set(secureIdCacheKey, user.id.toString());

        if (user.displayName)
            await this.storeDisplayName(user.displayName);
    }

    public async lock<T>(id: number, handler: () => Promise<T>): Promise<T> {
        const key = this.cacheKeyGenerator.generate(id);
        return this.redis.lock(key, handler, 30000);
    }

    public async displayNameExists(displayName: string): Promise<boolean> {
        const displayNamesCacheKey = this.cacheKeyGenerator.generate('DisplayNames');
        return await this.redis.cluster.sismember(displayNamesCacheKey, displayName.toLowerCase()) > 0;
    }

    public async removeDisplayName(displayName: string): Promise<void> {
        const displayNamesCacheKey = this.cacheKeyGenerator.generate('DisplayNames');
        await this.redis.cluster.srem(displayNamesCacheKey, displayName.toLowerCase());
    }

    private async getId(secureId: string): Promise<number | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate('SecureId-Id', secureId);
        const rawId = await this.redis.cluster.get(cacheKey);

        if (!rawId)
            return undefined;

        return Number(rawId);
    }

    public async storeDisplayName(displayName: string): Promise<void> {
        const displayNamesCacheKey = this.cacheKeyGenerator.generate('DisplayNames');
        await this.redis.cluster.sadd(displayNamesCacheKey, displayName.toLowerCase());
    }

    public async storeDisplayNames(displayNames: string[], clear: boolean = false): Promise<void> {
        const displayNamesCacheKey = this.cacheKeyGenerator.generate('DisplayNames');
        await this.redis.cluster.del(displayNamesCacheKey);
        await this.redis.cluster.sadd(displayNamesCacheKey, displayNames.map(d => d.toLowerCase()));
    }
}