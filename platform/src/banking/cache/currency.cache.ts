import { Singleton, Inject } from '../../core/ioc';
import { Redis, JsonSerialiser } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { CurrencyRate } from '../currency-rate';
import { Currency } from '../currency';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class CurrencyCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('CURRENCIES');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async getAll(): Promise<Currency[] | false> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItems = await this.redis.cluster.hvals(cacheKey) as string[];

        if (!rawItems || rawItems.length === 0)
            return false;

        return rawItems.filter(r => r !== 'NULL').map(r => this.serialiser.deserialise<Currency>(r));
    }

    public async store(...currencies: Currency[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();

        for (const currency of currencies)
            await this.redis.cluster.hset(cacheKey, currency.code, this.serialiser.serialise(currency));
    }

    public async getRates(): Promise<CurrencyRate[] | false> {
        const cacheKey = this.cacheKeyGenerator.generate('Rates');
        const rawItems = await this.redis.cluster.hvals(cacheKey) as string[];

        if (!rawItems || rawItems.length === 0)
            return false;

        return rawItems.map(r => this.serialiser.deserialise<CurrencyRate>(r));
    }

    public async getRate(currencyCode: string): Promise<CurrencyRate | undefined | false> {
        const cacheKey = this.cacheKeyGenerator.generate('Rates');
        const rawItem = await this.redis.cluster.hget(cacheKey, currencyCode);

        if (rawItem === 'NULL')
            return false;

        if (!rawItem) {
            await this.redis.cluster.hset(cacheKey, currencyCode, 'NULL');
            return undefined;
        }

        return this.serialiser.deserialise<CurrencyRate>(rawItem);
    }

    public async storeRates(...rates: CurrencyRate[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate('Rates');

        for (const rate of rates)
            await this.redis.cluster.hset(cacheKey, rate.currencyCode, this.serialiser.serialise(rate));
    }
}