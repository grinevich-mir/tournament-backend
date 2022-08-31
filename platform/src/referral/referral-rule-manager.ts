import { Singleton, Inject } from '../core/ioc';
import { ReferralRuleRepository } from './repositories';
import { ReferralRuleFilter } from './referral-rule-filter';
import { ReferralRule, NewReferralRule, ReferralRuleUpdate } from './referral-rule';
import { ReferralRuleCache } from './cache';
import { NewReferralRuleAction, ReferralRuleActionUpdate } from './referral-rule-action';
import { NotFoundError } from '../core';

@Singleton
export class ReferralRuleManager {
    constructor(
        @Inject private readonly repository: ReferralRuleRepository,
        @Inject private readonly cache: ReferralRuleCache) {
    }

    public async getAll(filter?: ReferralRuleFilter): Promise<ReferralRule[]> {
        let rules = await this.cache.getAll();

        if (rules.length === 0) {
            rules = await this.repository.getAll();
            await this.cache.store(...rules);
        }

        if (filter)
            rules = rules.filter(r => filter.enabled === undefined || r.enabled === filter.enabled)
                .filter(r => filter.groupId === undefined || r.groupId === filter.groupId)
                .filter(r => filter.event === undefined || r.event === filter.event);

        return rules;
    }

    public async get(id: number): Promise<ReferralRule | undefined> {
        const cachedItem = await this.cache.get(id);

        if (cachedItem)
            return cachedItem;

        const rule = await this.repository.get(id);

        if (!rule)
            return undefined;

        await this.cache.store(rule);
        return rule;
    }

    public async add(rule: NewReferralRule): Promise<ReferralRule> {
        const created = await this.repository.add(rule);
        await this.cache.store(created);
        return created;
    }

    public async update(id: number, rule: ReferralRuleUpdate): Promise<ReferralRule> {
        const updated = await this.repository.update(id, rule);
        await this.cache.store(updated);
        return updated;
    }

    public async remove(id: number): Promise<void> {
        await this.repository.remove(id);
        await this.cache.remove(id);
    }

    public async addAction(ruleId: number, action: NewReferralRuleAction): Promise<ReferralRule> {
        await this.repository.addAction(ruleId, action);
        const rule = await this.repository.get(ruleId) as ReferralRule;
        await this.cache.store(rule);
        return rule;
    }

    public async updateAction(id: number, action: ReferralRuleActionUpdate): Promise<ReferralRule> {
        const existing = await this.repository.getAction(id);

        if (!existing)
            throw new NotFoundError('Rule action not found.');

        await this.repository.updateAction(id, action);
        const rule = await this.repository.get(existing.ruleId) as ReferralRule;
        await this.cache.store(rule);
        return rule;
    }

    public async removeAction(id: number): Promise<ReferralRule> {
        const action = await this.repository.getAction(id);

        if (!action)
            throw new NotFoundError('Rule action not found.');

        await this.repository.removeAction(id);
        const rule = await this.repository.get(action.ruleId) as ReferralRule;
        await this.cache.store(rule);
        return rule;
    }
}