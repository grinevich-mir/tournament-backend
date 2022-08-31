import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { StatisticsTop } from '../statistics-top';

@Singleton
@LogClass()
export class TopWinnersCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('STATISTICS:TopWinners');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async getAll(skip?: number, take?: number, suffix?: string): Promise<StatisticsTop[] | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate(suffix);

        const start = skip === undefined ? 0 : skip;
        const stop = take === undefined ? - 1 : start + (take - 1);

        const rawValues = await this.redis.cluster.lrange(cacheKey, start, stop);

        if (!rawValues || rawValues.length === 0)
            return undefined;

        return rawValues.map(v => this.serialiser.deserialise<StatisticsTop>(v));
    }

    public async store(winners: StatisticsTop[], suffix?: string): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate(suffix);
        const jsonItems = winners.map(w => this.serialiser.serialise(w));
        await this.redis.cluster.del(cacheKey);
        await this.redis.cluster.lpush(cacheKey, jsonItems.reverse());
    }
}