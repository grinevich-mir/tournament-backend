import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ReferralGroup } from '../referral-group';
import _ from 'lodash';

@Singleton
@LogClass()
export class ReferralGroupCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('REFERRAL:Groups');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly seraliser: JsonSerialiser) {
        }

    public async getAll(): Promise<ReferralGroup[]> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawData = await this.redis.cluster.hvals(cacheKey);

        if (rawData.length === 0)
            return [];

        return _.sortBy(rawData.map(d => this.seraliser.deserialise<ReferralGroup>(d)), g => g.id);
    }

    public async get(id: number): Promise<ReferralGroup | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawData = await this.redis.cluster.hget(cacheKey, id.toString());

        if (!rawData)
            return undefined;

        return this.seraliser.deserialise<ReferralGroup>(rawData);
    }

    public async getDefault(): Promise<ReferralGroup | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate('Default');
        const rawData = await this.redis.cluster.get(cacheKey);

        if (!rawData)
            return undefined;

        return this.seraliser.deserialise<ReferralGroup>(rawData);
    }

    public async store(...groups: ReferralGroup[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const pipeline = this.redis.cluster.pipeline();

        for (const group of groups)
            pipeline.hset(cacheKey, group.id.toString(), this.seraliser.serialise(group));

        await pipeline.exec();
    }

    public async storeDefault(group: ReferralGroup): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate('Default');
        await this.redis.cluster.set(cacheKey, this.seraliser.serialise(group));
    }

    public async remove(id: number): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.hdel(cacheKey, id.toString());
    }
}