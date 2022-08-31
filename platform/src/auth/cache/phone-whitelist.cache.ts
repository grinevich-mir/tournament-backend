import { Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { PhoneWhitelistEntry } from '../phone-whitelist-entry';

@Singleton
export class PhoneWhitelistCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('AUTH:PhoneWhitelist');

    constructor(@Inject private readonly redis: Redis) { }

    public async getAll(): Promise<PhoneWhitelistEntry[] | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItems = await this.redis.cluster.hgetall(cacheKey);

        if (!rawItems)
            return undefined;

        const items: PhoneWhitelistEntry[] = [];

        for (const key in rawItems)
            items.push({ phoneNumber: key, descriptor: rawItems[key] });

        return items;
    }

    public async get(phoneNumber: string): Promise<PhoneWhitelistEntry | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItem = await this.redis.cluster.hget(cacheKey, phoneNumber);

        if (!rawItem)
            return undefined;

        return { phoneNumber, descriptor: rawItem };
    }

    public async exists(phoneNumber: string): Promise<boolean> {
        const cacheKey = this.cacheKeyGenerator.generate();
        return await this.redis.cluster.hexists(cacheKey, phoneNumber) === 1;
    }

    public async store(...items: PhoneWhitelistEntry[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();

        for (const item of items)
            await this.redis.cluster.hset(cacheKey, item.phoneNumber, item.descriptor);
    }

    public async remove(phoneNumber: string): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.hdel(cacheKey, phoneNumber);
    }
}