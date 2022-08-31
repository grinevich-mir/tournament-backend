import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { CacheKeyGenerator } from '../../core/cache';
import { JsonSerialiser, Redis } from '../../core';
import { StatisticsBigWins } from '../statistics-big-wins';

@Singleton
@LogClass()
export class BigWinsCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('STATISTICS:BigWins');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async getAll(count: number, suffix?: string): Promise<StatisticsBigWins[]> {
        const cacheKey = this.cacheKeyGenerator.generate(suffix);
        const stop = count - 1;
        const rawWinners: string[] = await this.redis.cluster.zrevrange(cacheKey, 0, stop);

        if (!rawWinners || rawWinners.length === 0)
            return [];

        return rawWinners.map(w => this.serialiser.deserialise<StatisticsBigWins>(w));
    }

    public async store(winner: StatisticsBigWins, suffix?: string): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate(suffix);
        const winnerItem = this.serialiser.serialise(winner);
        await this.redis.cluster.pipeline().zadd(cacheKey, 'NX', winner.amount.toString(), winnerItem).exec();
    }
}