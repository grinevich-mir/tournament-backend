import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { StoreItem } from '../store-item';
import { StoreItemLastPurchase } from '../store-item-last-purchase';
import { StoreItemType } from '../store-item-type';

@Singleton
export class StoreCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('STORE');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async getAll(): Promise<StoreItem[] | false> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItems = await this.redis.cluster.hvals(cacheKey) as string[];

        if (!rawItems || rawItems.length === 0)
            return false;

        return rawItems.map(r => this.serialiser.deserialise<StoreItem>(r));
    }

    public async get(id: number): Promise<StoreItem | false> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItem = await this.redis.cluster.hget(cacheKey, id.toString()) as string;

        if (!rawItem)
            return false;

        return this.serialiser.deserialise<StoreItem>(rawItem);
    }

    public async store(...items: StoreItem[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();

        for (const item of items)
            await this.redis.cluster.hset(cacheKey, item.id.toString(), this.serialiser.serialise(item));
    }

    public async remove(id: number): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.hdel(cacheKey, id.toString());
    }

    public async getLastPurchases(userId: number): Promise<StoreItemLastPurchase[] | false> {
        const cacheKey = this.cacheKeyGenerator.generate(userId, 'LastPurchases');
        const rawItems = await this.redis.cluster.hvals(cacheKey) as string[];

        if (!rawItems || rawItems.length === 0)
            return false;

        return rawItems.map(r => this.serialiser.deserialise<StoreItemLastPurchase>(r));
    }

    public async storeLastPurchase(userId: number, type: StoreItemType, quantity: number): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate(userId, 'LastPurchases');
        const lastPurchase: StoreItemLastPurchase = {
            type,
            quantity
        };
        await this.redis.cluster.hset(cacheKey, type, this.serialiser.serialise(lastPurchase));
    }
}