import { Redis, JsonSerialiser } from '../../core';
import { Inject, Singleton } from '../../core/ioc';
import { CacheKeyGenerator } from '../../core/cache';
import { LogClass } from '../../core/logging';
import { JackpotWinner } from '../jackpot-winner';

const MAX_WINNERS = 30;

@Singleton
@LogClass()
export class JackpotWinnerCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('JACKPOT-WINNERS');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async getAll(count: number): Promise<JackpotWinner[]> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const stop = count - 1;
        const rawWinners = await this.redis.cluster.lrange(cacheKey, 0, stop) as string[];

        if (!rawWinners || rawWinners.length === 0)
            return [];

        return rawWinners.map(w => this.serialiser.deserialise<JackpotWinner>(w));
    }

    public async add(winner: JackpotWinner): Promise<void> {
        const json = this.serialiser.serialise(winner);
        const cacheKey = this.cacheKeyGenerator.generate();

        await this.redis.cluster
            .pipeline()
            .lpush(cacheKey, json)
            .ltrim(cacheKey, 0, MAX_WINNERS - 1)
            .exec();
    }

    public async replaceAll(winners: JackpotWinner[]): Promise<void> {
        const json = winners.map(w => this.serialiser.serialise(w));
        const cacheKey = this.cacheKeyGenerator.generate();

        await this.redis.cluster
            .pipeline()
            .del(cacheKey)
            .lpush(cacheKey, json)
            .exec();
    }
}