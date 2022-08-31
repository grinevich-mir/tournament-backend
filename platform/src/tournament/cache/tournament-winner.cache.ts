import { Redis, JsonSerialiser } from '../../core';
import { TournamentWinner } from '../tournament-winner';
import { Inject, Singleton } from '../../core/ioc';
import { CacheKeyGenerator } from '../../core/cache';
import { LogClass } from '../../core/logging';

const MAX_WINNERS = 30;

@Singleton
@LogClass()
export class TournamentWinnerCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('TOURNAMENT-WINNERS');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async getAll(skinId: string, count: number): Promise<TournamentWinner[]> {
        const cacheKey = this.cacheKeyGenerator.generate(skinId);
        const stop = count - 1;
        const rawWinners = await this.redis.cluster.lrange(cacheKey, 0, stop) as string[];

        if (!rawWinners || rawWinners.length === 0)
            return[];

        return rawWinners.map(w => this.serialiser.deserialise<TournamentWinner>(w));
    }

    public async add(winner: TournamentWinner): Promise<void> {
        const json = this.serialiser.serialise(winner);

        for (const skinId of winner.skins) {
            const cacheKey = this.cacheKeyGenerator.generate(skinId);

            await this.redis.cluster
                .pipeline()
                .lpush(cacheKey, json)
                .ltrim(cacheKey, 0, MAX_WINNERS - 1)
                .exec();
        }
    }
}