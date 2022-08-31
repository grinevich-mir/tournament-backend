import { Singleton, Inject } from '../../core/ioc';
import { Skin } from '../skin';
import { CacheKeyGenerator } from '../../core/cache';
import { Redis, JsonSerialiser } from '../../core';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class SkinCache {
    private cacheKeyGenerator = new CacheKeyGenerator('SKINS');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async getAll(): Promise<Skin[] | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawValues = await this.redis.cluster.hvals(cacheKey) as string[];

        if (!rawValues || rawValues.length === 0)
            return undefined;

        return rawValues.map(v => this.serialiser.deserialise<Skin>(v));
    }

    public async get(id: string): Promise<Skin | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawValue = await this.redis.cluster.hget(cacheKey, id);

        if (!rawValue)
            return undefined;

        return this.serialiser.deserialise<Skin>(rawValue);
    }

    public async getByUserPoolId(userPoolId: string): Promise<Skin | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate('UserPoolId', 'Id');
        const skinId = await this.redis.cluster.hget(cacheKey, userPoolId);

        if (!skinId)
            return undefined;

        return this.get(skinId);
    }

    public async store(skin: Skin): Promise<void> {
        const listCacheKey = this.cacheKeyGenerator.generate();
        const userPoolIdCacheKey = this.cacheKeyGenerator.generate('UserPoolId', 'Id');

        await this.redis.cluster.hset(listCacheKey, skin.id, this.serialiser.serialise(skin));
        await this.redis.cluster.hset(userPoolIdCacheKey, skin.userPoolId, skin.id);
    }
}