import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { GameSession } from '../game-session';
import moment from 'moment';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class GameSessionCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('GAME-SESSIONS');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async get(id: number | string): Promise<GameSession | undefined> {
        if (typeof id === 'string') {
            const intId = await this.getIdFromSecureId(id);

            if (intId === undefined)
                return undefined;

            id = intId;
        }

        const cacheKey = this.cacheKeyGenerator.generate(id);
        const rawInfo = await this.redis.cluster.get(cacheKey);

        if (!rawInfo)
            return undefined;

        return this.serialiser.deserialise<GameSession>(rawInfo);
    }

    private async getIdFromSecureId(secureId: string): Promise<number | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate('SecureId-Id', secureId);

        const idRaw = await this.redis.cluster.get(cacheKey);

        if (!idRaw)
            return undefined;

        return Number(idRaw);
    }

    public async store(session: GameSession): Promise<void> {
        const infoCacheKey = this.cacheKeyGenerator.generate(session.id);
        const secureIdCacheKey  = this.cacheKeyGenerator.generate('SecureId-Id', session.secureId);

        const jsonString = this.serialiser.serialise(session);
        const expiration = moment(session.expireTime).unix();

        await this.redis.cluster.pipeline().set(infoCacheKey, jsonString).expireat(infoCacheKey, expiration).exec();
        await this.redis.cluster.pipeline().set(secureIdCacheKey, session.id.toString()).expireat(secureIdCacheKey, expiration).exec();
    }

    public async remove(...ids: number[]): Promise<void> {
        for (const id of ids) {
            const session = await this.get(id);

            if (!session)
                continue;

            const infoCacheKey = this.cacheKeyGenerator.generate(session.id);
            const secureIdCacheKey  = this.cacheKeyGenerator.generate('SecureId-Id', session.secureId);
            await this.redis.cluster.del(infoCacheKey, secureIdCacheKey);
        }
    }
}