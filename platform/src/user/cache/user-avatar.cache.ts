import { CacheKeyGenerator } from '../../core/cache';
import { Singleton, Inject } from '../../core/ioc';
import { JsonSerialiser, Redis } from '../../core';
import { UserAvatar } from '../user-avatar';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class UserAvatarCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('USER-AVATARS');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser)  {
        }

    public async getAll(skinId: string): Promise<UserAvatar[]> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItems = await this.redis.cluster.hvals(cacheKey) as string[];

        if (!rawItems || rawItems.length === 0)
            return [];

        const avatars = rawItems
            .map(v => this.serialiser.deserialise<UserAvatar>(v))
            .filter(a => a.skinId === skinId);

        return avatars;
    }

    public async get(id: number): Promise<UserAvatar | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItem = await this.redis.cluster.hget(cacheKey, id.toString());

        if (!rawItem)
            return undefined;

        return this.serialiser.deserialise<UserAvatar>(rawItem);
    }

    public async store(...avatars: UserAvatar[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();

        for (const avatar of avatars)
            await this.redis.cluster.hset(cacheKey, avatar.id.toString(), this.serialiser.serialise(avatar));
    }
}