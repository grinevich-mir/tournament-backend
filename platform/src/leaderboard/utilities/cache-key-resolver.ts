import { Singleton, Inject } from '../../core/ioc';
import { Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { LogClass } from '../../core/logging';

const CACHE_PREFIX = 'LEADERBOARDS';

export interface LeaderboardCacheKeys {
    info: string;
    entries: string;
    runningEntries: string;
    events: string;
    activeEntries: string;
}

@Singleton
@LogClass()
export class CacheKeyResolver {
    private readonly cacheKeyGenerator = new CacheKeyGenerator(CACHE_PREFIX);

    constructor(
        @Inject private readonly redis: Redis) {
        }

    public get index(): string {
        return CACHE_PREFIX;
    }

    public forLeaderboard(id: number): LeaderboardCacheKeys {
        return {
            info: this.cacheKeyGenerator.generate(`{${id}}`),
            entries: this.cacheKeyGenerator.generate(`{${id}}`, 'Entries'),
            runningEntries: this.cacheKeyGenerator.generate(`{${id}}`, 'RunningEntries'),
            events: this.cacheKeyGenerator.generate(`{${id}}`, 'Events'),
            activeEntries: this.cacheKeyGenerator.generate(`{${id}}`, 'ActiveEntries'),
        };
    }

    public forEvent(id: number, eventName: string): string {
        return this.cacheKeyGenerator.generate(`{${id}}`, 'Events', eventName);
    }

    public async forEvents(id: number): Promise<string[]> {
        const cacheKeys = this.forLeaderboard(id);
        const eventNames = await this.redis.cluster.smembers(cacheKeys.events);

        if (!eventNames)
            return [];

        return eventNames.map((event: string) => this.forEvent(id, event));
    }
}