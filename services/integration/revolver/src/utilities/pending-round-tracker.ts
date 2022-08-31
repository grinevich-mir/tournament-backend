import { CacheKeyGenerator } from '@tcom/platform/lib/core/cache';
import { Redis, JsonSerialiser } from '@tcom/platform/lib/core';
import { Inject } from '@tcom/platform/lib/core/ioc';
import Logger from '@tcom/platform/lib/core/logging';

export interface PendingRound {
    roundId: string;
    reference: string;
}

export class PendingRoundTracker {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('REVOLVER:PendingRounds');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly jsonSerialiser: JsonSerialiser) {
        }

    public async get(roundId: string): Promise<PendingRound | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawPendingRound = await this.redis.cluster.hget(cacheKey, roundId);

        if (!rawPendingRound)
            return undefined;

        return this.jsonSerialiser.deserialise(rawPendingRound);
    }

    public async getAndRemove(roundId: string): Promise<PendingRound | undefined> {
        const round = await this.get(roundId);

        if (!round)
            return undefined;

        await this.remove(roundId);
        return round;
    }

    public async store(roundId: string, reference: string): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();

        if (await this.redis.cluster.hexists(cacheKey, roundId)) {
            Logger.warn(`Pending round ${roundId} already exists, it will not be updated in the cache.`);
            return;
        }

        const pendingRound: PendingRound = {
            roundId,
            reference
        };

        await this.redis.cluster.hset(cacheKey, roundId, this.jsonSerialiser.serialise(pendingRound));
    }

    public async remove(roundId: string): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.hdel(cacheKey, roundId);
    }
}