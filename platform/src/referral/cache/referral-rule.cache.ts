import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ReferralRule } from '../referral-rule';

@Singleton
@LogClass()
export class ReferralRuleCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('REFERRAL:Rules');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly seraliser: JsonSerialiser) {
        }

    public async getAll(): Promise<ReferralRule[]> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawData = await this.redis.cluster.hvals(cacheKey);

        if (rawData.length === 0)
            return [];

        return rawData.map(d => this.seraliser.deserialise<ReferralRule>(d));
    }

    public async get(id: number): Promise<ReferralRule | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawData = await this.redis.cluster.hget(cacheKey, id.toString());

        if (!rawData)
            return undefined;

        return this.seraliser.deserialise<ReferralRule>(rawData);
    }

    public async store(...rules: ReferralRule[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const pipeline = this.redis.cluster.pipeline();

        for (const rule of rules)
            pipeline.hset(cacheKey, rule.id.toString(), this.seraliser.serialise(rule));

        await pipeline.exec();
    }

    public async remove(id: number): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.hdel(cacheKey, id.toString());
    }
}