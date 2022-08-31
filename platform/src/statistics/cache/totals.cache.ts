import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { StatisticsTotals } from '../statistics-totals';

@Singleton
@LogClass()
export class TotalsCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('STATISTICS:Totals');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async get(): Promise<StatisticsTotals | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();

        const rawValue = await this.redis.cluster.get(cacheKey);

        if (!rawValue)
            return undefined;

        return this.serialiser.deserialise<StatisticsTotals>(rawValue);
    }

    public async store(totals: StatisticsTotals): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const json = this.serialiser.serialise(totals);
        await this.redis.cluster.set(cacheKey, json);
    }
}