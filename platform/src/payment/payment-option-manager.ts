import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { PaymentOptionCache } from './cache';
import { NewPaymentOption, PaymentOption, PaymentOptionUpdate } from './payment-option';
import { PaymentOptionFilter } from './payment-option-filter';
import { PaymentOptionRepository } from './repositories';

@Singleton
@LogClass()
export class PaymentOptionManager {
    constructor(
        @Inject private readonly repository: PaymentOptionRepository,
        @Inject private readonly cache: PaymentOptionCache) {
    }

    public async getAll(filter?: PaymentOptionFilter): Promise<PaymentOption[]> {
        const cachedItems = await this.cache.getAll();

        if (cachedItems.length > 0)
            return this.filter(cachedItems, filter);

        const options = await this.populateCache();

        return this.filter(options, filter);
    }

    public async get(id: number): Promise<PaymentOption | undefined> {
        const cachedItem = await this.cache.get(id);

        if (cachedItem)
            return cachedItem;

        const items = await this.populateCache();

        return items.find(p => p.id === id);
    }

    public async add(option: NewPaymentOption): Promise<void> {
        const options = await this.getAll();

        if (options?.some(p => p.provider === option.provider))
            throw new Error(`Payment options for provider '${option.provider}' already exist.`);

        await this.repository.add(option);
        await this.populateCache();
    }

    public async update(id: number, update: PaymentOptionUpdate): Promise<PaymentOption> {
        const option = await this.get(id);

        if (!option)
            throw new Error(`Payment option '${id}' does not exist.`);

        await this.repository.update(id, update);

        const items = await this.populateCache();
        const updated = items.find(p => p.id === id);

        if (!updated)
            throw new Error(`Updated payment option '${id}' missing from cache.`);

        return updated;
    }

    public async remove(id: number): Promise<void> {
        const option = await this.cache.get(id);

        if (!option)
            throw new Error(`Payment option '${id}' does not exist.`);

        await this.repository.remove(id);
        await this.populateCache();
    }

    private async populateCache(): Promise<PaymentOption[]> {
        const options = await this.repository.getAll();

        await this.cache.clear();
        await this.cache.store(...options);

        return options;
    }

    private filter(options: PaymentOption[], filter?: PaymentOptionFilter): PaymentOption[] {
        if (!filter)
            return options;

        return options
            .filter(o => filter.enabled === undefined || o.enabled === filter.enabled)
            .filter(o => filter.public === undefined || o.public === filter.public)
            .filter(o => !filter.country || o.countries.includes(filter.country))
            .filter(o => !filter.currency || o.currencies.includes(filter.currency))
            .filter(o => !filter.provider || o.provider === filter.provider);
    }
}