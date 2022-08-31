import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { PaymentOption } from '../payment-option';

@Singleton
@LogClass()
export class PaymentOptionCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('PAYMENTS:Options');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async get(id: number): Promise<PaymentOption | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawValue = await this.redis.cluster.hget(cacheKey, id.toString());

        if (!rawValue)
            return undefined;

        return this.serialiser.deserialise(rawValue);
    }

    public async getAll(): Promise<PaymentOption[]> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawValues = await this.redis.cluster.hvals(cacheKey);

        if (!rawValues || rawValues.length === 0)
            return [];

        return rawValues.map(v =>  this.serialiser.deserialise(v));
    }

    public async store(...options: PaymentOption[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const pipeline = this.redis.cluster.pipeline();

        for (const option of options)
            pipeline.hset(cacheKey, option.id.toString(), this.serialiser.serialise(option));

        await pipeline.exec();
    }

    public async clear(): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.del(cacheKey);
    }
}