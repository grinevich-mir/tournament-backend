import { Singleton, Inject } from '../../core/ioc';
import { TournamentEntry } from '../tournament-entry';
import { Redis, JsonSerialiser } from '../../core';
import moment from 'moment';
import { CACHE_PREFIX } from './constants';
import { CacheKeyGenerator } from '../../core/cache';
import { LogClass } from '../../core/logging';

interface CacheKeys {
    id: string;
    entries: string;
    token: string;
}

@Singleton
@LogClass()
export class TournamentEntryCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator(CACHE_PREFIX);

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async get(tournamentId: number, userId: number): Promise<TournamentEntry | undefined> {
        const cacheKey = this.getEntriesCacheKey(tournamentId);
        const rawEntry = await this.redis.cluster.hget(cacheKey, userId.toString());

        if (!rawEntry)
            return undefined;

        return this.serialiser.deserialise<TournamentEntry>(rawEntry);
    }

    public async getByToken(token: string): Promise<TournamentEntry | undefined> {
        const cacheKey = this.getTokenCacheKey(token);
        const data = await this.redis.cluster.hmget(cacheKey, 'tournamentId', 'userId') as string[];

        if (!data || data.length === 0)
            return undefined;

        const tournamentId = Number(data[0]);
        const userId = Number(data[1]);

        return this.get(tournamentId, userId);
    }

    public async getById(id: number): Promise<TournamentEntry | undefined> {
        const cacheKey = this.getIdCacheKey(id);
        const data = await this.redis.cluster.hmget(cacheKey, 'tournamentId', 'userId') as string[];

        if (!data || data.length === 0)
            return undefined;

        const tournamentId = Number(data[0]);
        const userId = Number(data[1]);

        return this.get(tournamentId, userId);
    }

    public async getAll(tournamentId: number): Promise<TournamentEntry[]> {
        const cacheKey = this.getEntriesCacheKey(tournamentId);
        const rawEntries = await this.redis.cluster.hvals(cacheKey) as string[];

        if (!rawEntries || rawEntries.length === 0)
            return [];

        return rawEntries.map(r => this.serialiser.deserialise<TournamentEntry>(r));
    }

    public async getMultiple(tournamentId: number, userIds: number[]): Promise<TournamentEntry[]> {
        if (userIds.length === 0)
            return [];

        const cacheKey = this.getEntriesCacheKey(tournamentId);

        const rawEntries = await this.redis.cluster.hmget(cacheKey, ...userIds.map(i => i.toString())) as string[];

        if (!rawEntries || rawEntries.length === 0)
            return [];

        return rawEntries.map(r => this.serialiser.deserialise<TournamentEntry>(r));
    }

    public async exists(tournamentId: number, userId: number): Promise<boolean> {
        const cacheKey = this.getEntriesCacheKey(tournamentId);
        return !!await this.redis.cluster.hexists(cacheKey, userId.toString());
    }

    public async delete(entry: TournamentEntry): Promise<void> {
        const cacheKeys = this.getCacheKeys(entry);
        await this.redis.cluster.hdel(cacheKeys.entries, entry.userId.toString());
        await this.redis.cluster.del(cacheKeys.token);
        await this.redis.cluster.del(cacheKeys.id);
    }

    public async store(entry: TournamentEntry, expireTime?: Date): Promise<void> {
        const cacheKeys = this.getCacheKeys(entry);

        const entryPipeline = this.redis.cluster.pipeline()
            .hset(cacheKeys.entries, entry.userId.toString(), this.serialiser.serialise(entry));

        const tokenPipeline = this.redis.cluster.pipeline()
            .hmset(cacheKeys.token, 'tournamentId', entry.tournamentId.toString(), 'userId', entry.userId.toString());

        const idPipeline = this.redis.cluster.pipeline()
            .hmset(cacheKeys.id, 'tournamentId', entry.tournamentId.toString(), 'userId', entry.userId.toString());

        if (expireTime) {
            entryPipeline.expireat(cacheKeys.entries, moment(expireTime).unix());
            tokenPipeline.expireat(cacheKeys.token, moment(expireTime).unix());
            idPipeline.expireat(cacheKeys.id, moment(expireTime).unix());
        } else {
            const ttl = await this.redis.cluster.ttl(cacheKeys.entries);

            if (ttl > -1) {
                entryPipeline.expire(cacheKeys.entries, ttl);
                tokenPipeline.expire(cacheKeys.token, ttl);
                idPipeline.expire(cacheKeys.id, ttl);
            }
        }

        await Promise.all([
            entryPipeline.exec(),
            tokenPipeline.exec(),
            idPipeline.exec()
        ]);
    }

    public async lock<T>(id: number, handler: () => Promise<T>): Promise<T> {
        const key = this.cacheKeyGenerator.generate('Entry', id);
        return this.redis.lock(key, handler, 30000);
    }

    private getEntriesCacheKey(tournamentId: number): string {
        return this.cacheKeyGenerator.generate(tournamentId, 'Entries');
    }

    private getTokenCacheKey(token: string): string {
        return this.cacheKeyGenerator.generate('Entry', 'Token', token);
    }

    private getIdCacheKey(id: number): string {
        return this.cacheKeyGenerator.generate('Entry', 'Id', id);
    }

    private getCacheKeys(entry: TournamentEntry): CacheKeys {
        return {
            id: this.getIdCacheKey(entry.id),
            entries: this.getEntriesCacheKey(entry.tournamentId),
            token: this.getTokenCacheKey(entry.token)
        };
    }
}