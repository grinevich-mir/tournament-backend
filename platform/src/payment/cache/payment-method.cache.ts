import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { PaymentMethod } from '../payment-method';

@Singleton
@LogClass()
export class PaymentMethodCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('PAYMENTS');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly seraliser: JsonSerialiser) {
        }

    public async getActiveForUser(userId: number): Promise<PaymentMethod | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate(`Method:User:${userId}:Active`);
        const rawData = await this.redis.cluster.get(cacheKey);

        if (!rawData)
            return undefined;

        return this.seraliser.deserialise<PaymentMethod>(rawData);
    }

    public async storeActiveForUser(paymentMethod: PaymentMethod): Promise<void> {
        if (!paymentMethod.enabled)
            return;

        const cacheKey = this.cacheKeyGenerator.generate(`Method:User:${paymentMethod.userId}:Active`);
        await this.redis.cluster.set(cacheKey, this.seraliser.serialise(paymentMethod));
    }

    public async removeActiveForUser(paymentMethod: PaymentMethod): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate(`Method:User:${paymentMethod.userId}:Active`);
        await this.redis.cluster.del(cacheKey);
    }
}