import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { TournamentIntro } from '../tournament-intro';

@Singleton
export class TournamentIntroCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('TOURNAMENT-INTRO');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async get(id: number): Promise<TournamentIntro | false> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItem = await this.redis.cluster.hget(cacheKey, id.toString()) as string;

        if (!rawItem)
            return false;

        return this.serialiser.deserialise<TournamentIntro>(rawItem);
    }

    public async store(item: TournamentIntro): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.hset(cacheKey, item.id.toString(), this.serialiser.serialise(item));
    }

    public async remove(id: number): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.hdel(cacheKey, id.toString());
    }
}