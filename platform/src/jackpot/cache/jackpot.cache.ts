import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { Jackpot } from '../jackpot';

@Singleton
@LogClass()
export class JackpotCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('JACKPOTS');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly seraliser: JsonSerialiser) {
        }

    public async get(id: number): Promise<Jackpot | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawData = await this.redis.cluster.hget(cacheKey, id.toString());

        if (!rawData)
            return undefined;

        return this.seraliser.deserialise(rawData);
    }

    public async getAll(): Promise<Jackpot[]> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawData = await this.redis.cluster.hvals(cacheKey);

        if (rawData.length === 0)
            return [];

        return rawData.map(d => this.seraliser.deserialise(d));
    }

    public async getMany(...ids: number[]): Promise<Jackpot[]> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawData  = await this.redis.cluster.hmget(cacheKey, ...ids.map(i => i.toString()));

        if (rawData.length === 0)
            return [];

        return rawData.filter(d => d !== null).map(d => this.seraliser.deserialise(d as string));
    }

    public async lock<T>(id: number, handler: () => Promise<T>): Promise<T> {
        const key = this.cacheKeyGenerator.generate(id);
        return this.redis.lock(key, handler, 30000);
    }

    public async store(...jackpots: Jackpot[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();

        for (const jackpot of jackpots)
            await this.redis.cluster.hset(cacheKey, jackpot.id.toString(), this.seraliser.serialise(jackpot));
    }
}