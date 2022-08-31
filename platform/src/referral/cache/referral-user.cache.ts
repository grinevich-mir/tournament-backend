import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ReferralUser } from '../referral-user';

@Singleton
@LogClass()
export class ReferralUserCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('REFERRAL:Users');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly seraliser: JsonSerialiser) {
        }

    public async get(userId: number): Promise<ReferralUser | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawData = await this.redis.cluster.hget(cacheKey, userId.toString());

        if (!rawData)
            return undefined;

        return this.seraliser.deserialise<ReferralUser>(rawData);
    }

    public async getByCode(code: string): Promise<ReferralUser | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate('Code-UserId', code);
        const rawData = await this.redis.cluster.hget(cacheKey, code);

        if (!rawData || Number.isNaN(rawData as any))
            return undefined;

        return this.get(Number(rawData));
    }

    public async getBySlug(slug: string): Promise<ReferralUser | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate('Slug-UserId', slug);
        const rawData = await this.redis.cluster.hget(cacheKey, slug);

        if (!rawData || Number.isNaN(rawData as any))
            return undefined;

        return this.get(Number(rawData));
    }

    public async store(user: ReferralUser): Promise<void> {
        const userCacheKey = this.cacheKeyGenerator.generate();
        const codeCacheKey = this.cacheKeyGenerator.generate('Code-UserId', user.code);
        const slugCacheKey = this.cacheKeyGenerator.generate('Slug-UserId', user.slug);

        const oldUser = await this.get(user.userId);

        if (oldUser)
            await Promise.all([
                this.redis.cluster.hdel(codeCacheKey, oldUser.code),
                this.redis.cluster.hdel(slugCacheKey, oldUser.slug)
            ]);

        await Promise.all([
            this.redis.cluster.hset(userCacheKey, user.userId.toString(), this.seraliser.serialise(user)),
            this.redis.cluster.hset(codeCacheKey, user.code, user.userId),
            this.redis.cluster.hset(slugCacheKey, user.slug, user.userId)
        ]);
    }
}