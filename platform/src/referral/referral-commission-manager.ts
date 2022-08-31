import { NotFoundError } from '../core';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import _ from 'lodash';
import { ReferralCommissionRate, NewReferralCommissionRate, ReferralCommissionRateUpdate } from './referral-commission-rate';
import { ReferralCommissionRateCache } from './cache';
import { ReferralCommissionRateRepository } from './repositories';
import { ReferralCommissionRateFilter } from './referral-commission-rate-filter';

@Singleton
@LogClass()
export class ReferralCommissionManager {
    constructor(
        @Inject private readonly cache: ReferralCommissionRateCache,
        @Inject private readonly repository: ReferralCommissionRateRepository) {
    }

    public async getRates(filter?: ReferralCommissionRateFilter): Promise<ReferralCommissionRate[]> {
        let rates = await this.cache.getAll();

        if (rates.length === 0) {
            rates = await this.repository.getAll();

            if (rates.length > 0)
                await this.cache.store(...rates);
        }

        if (filter)
            rates = rates
                .filter(r => filter.enabled === undefined || r.enabled === filter.enabled)
                .filter(r => filter.groupId === undefined || r.groupId === filter.groupId);

        return _.sortBy(rates, g => g.groupId, g => g.level);
    }

    public async getRate(groupId: number, level: number): Promise<ReferralCommissionRate | undefined> {
        const cachedItem = await this.cache.get(groupId, level);

        if (cachedItem)
            return cachedItem;

        const rate = await this.repository.get(groupId, level);

        if (rate)
            await this.cache.store(rate);

        return rate;
    }

    public async addRate(groupId: number, level: number, rate: NewReferralCommissionRate): Promise<ReferralCommissionRate> {
        const created = await this.repository.add(groupId, level, rate);
        await this.cache.store(created);
        return created;
    }

    public async updateRate(groupId: number, level: number, rate: ReferralCommissionRateUpdate): Promise<ReferralCommissionRate> {
        const existing = await this.repository.get(groupId, level);

        if (!existing)
            throw new NotFoundError('Referral commission rate not found.');

        const updated = await this.repository.update(groupId, level, rate);
        await this.cache.store(updated);
        return updated;
    }

    public async removeRate(groupId: number, level: number): Promise<void> {
        await this.repository.remove(groupId, level);
        await this.cache.remove(groupId, level);
    }
}