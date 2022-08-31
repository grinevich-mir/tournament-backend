import { Singleton, Inject } from '../core/ioc';
import { CurrencyRepository } from './repositories';
import { CurrencyEntityMapper } from './entities/mappers';
import { CurrencyFilter } from './currency-filter';
import { Currency } from './currency';
import { PlatformEventDispatcher } from '../core/events';
import { CurrencyAddedEvent } from './events';
import { CurrencyRate } from './currency-rate';
import { CurrencyCache } from './cache';
import { ForbiddenError, NotFoundError } from '../core';
import { LogClass } from '../core/logging';
import { toMoney } from './utilities';

@Singleton
@LogClass()
export class CurrencyManager {
    constructor(
        @Inject private readonly repository: CurrencyRepository,
        @Inject private readonly cache: CurrencyCache,
        @Inject private readonly entityMapper: CurrencyEntityMapper,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
        }

    public async getAll(filter?: CurrencyFilter): Promise<Currency[]> {
        const cached = await this.cache.getAll();

        if (cached)
            return cached;

        const entities = await this.repository.getAll(filter);
        const currencies = entities.map(e => this.entityMapper.fromEntity(e));
        await this.cache.store(...currencies);
        return currencies;
    }

    public async add(code: string, rate: number): Promise<Currency> {
        const entity =  await this.repository.add(code, rate);
        const currency = this.entityMapper.fromEntity(entity);
        await this.cache.store(currency);
        await this.eventDispatcher.send(new CurrencyAddedEvent(code, rate));
        return currency;
    }

    public async getRate(currencyCode: string): Promise<CurrencyRate | undefined> {
        const cached = await this.cache.getRate(currencyCode);

        if (cached || cached === undefined)
            return cached;

        const rates = await this.getRates();
        return rates.find(r => r.currencyCode === currencyCode);
    }

    public async getRates(): Promise<CurrencyRate[]> {
        const cached = await this.cache.getRates();

        if (cached)
            return cached;

        const entities = await this.repository.getRates();
        const rates = entities.map(e => this.entityMapper.rateFromEntity(e));
        await this.cache.storeRates(...rates);
        return rates;
    }

    public async setRate(code: string, rate: number): Promise<void> {
        if (code === 'USD')
            throw new ForbiddenError('Cannot update base currency (USD) rate.');

        await this.repository.setRate(code, rate);
        const record: CurrencyRate = {
            currencyCode: code,
            rate,
            createTime: new Date(),
            updateTime: new Date()
        };
        await this.cache.storeRates(record);
    }

    public async convert(amount: number, fromCurrencyCode: string, toCurrencyCode: string): Promise<number> {
        const money = toMoney(amount, fromCurrencyCode);
        let result = amount;
        let fromRateValue = 1;
        let toRateValue = 1;

        if (fromCurrencyCode !== toCurrencyCode) {
            const fromRate = await this.getRate(fromCurrencyCode);

            if (!fromRate)
                throw new NotFoundError(`Rate for currency '${fromCurrencyCode}' not found.`);

            const toRate = await this.getRate(toCurrencyCode);

            if (!toRate)
                throw new NotFoundError(`Rate for currency '${fromCurrencyCode}' not found.`);

            fromRateValue = fromRate.rate;
            toRateValue = toRate.rate;

            const baseAmount = money.multiply(fromRateValue);
            result = baseAmount.divide(toRateValue).toUnit();
        }

        return result;
    }
}