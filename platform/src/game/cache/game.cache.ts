import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { Redis, JsonSerialiser } from '../../core';
import { Game } from '../game';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class GameCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('GAMES');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }


    public async get(id: number): Promise<Game | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawInfo = await this.redis.cluster.hget(cacheKey, id.toString());

        if (!rawInfo)
            return undefined;

        return this.serialiser.deserialise<Game>(rawInfo);
    }

    public async store(game: Game): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const jsonString = this.serialiser.serialise(game);
        await this.redis.cluster.hset(cacheKey, game.id.toString(), jsonString);
    }
}