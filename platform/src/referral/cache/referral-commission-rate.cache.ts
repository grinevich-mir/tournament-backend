import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ReferralCommissionRate } from '../referral-commission-rate';

@Singleton
@LogClass()
export class ReferralCommissionRateCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('REFERRAL:Commission:Rates');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly seraliser: JsonSerialiser) {
        }

    public async getAll(): Promise<ReferralCommissionRate[]> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawData = await this.redis.cluster.hvals(cacheKey);

        if (rawData.length === 0)
            return [];

        return rawData.map(d => this.seraliser.deserialise<ReferralCommissionRate>(d));
    }

    public async get(groupId: number, level: number): Promise<ReferralCommissionRate | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawData = await this.redis.cluster.hget(cacheKey, this.getKey(groupId, level));

        if (!rawData)
            return undefined;

        return this.seraliser.deserialise<ReferralCommissionRate>(rawData);
    }

    public async store(...rates: ReferralCommissionRate[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const pipeline = this.redis.cluster.pipeline();

        for (const rate of rates)
            pipeline.hset(cacheKey, this.getKey(rate.groupId, rate.level), this.seraliser.serialise(rate));

        await pipeline.exec();
    }

    public async remove(groupId: number, level: number): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.hdel(cacheKey, this.getKey(groupId, level));
    }

    private getKey(groupId: number, level: number): string {
        return `${groupId}-${level}`;
    }
}