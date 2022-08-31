import { Singleton, Inject } from '../core/ioc';
import { ReferralEventType } from './referral-event-type';
import { Referral } from './referral';
import { ReferralRuleManager } from './referral-rule-manager';
import _ from 'lodash';
import { LogClass } from '../core/logging';
import { ReferralRuleMatcherFactory, ReferralRuleActionProcessorFactory, ReferralRuleMatcher } from './rules';
import { ReferralRuleActionContext } from './rules/referral-rule-action-context';
import { ReferralRule } from './referral-rule';

@Singleton
@LogClass()
export class ReferralRuleProcessor {
    constructor(
        @Inject private readonly ruleManager: ReferralRuleManager,
        @Inject private readonly matcherFactory: ReferralRuleMatcherFactory,
        @Inject private readonly actionProcessorFactory: ReferralRuleActionProcessorFactory) {
    }

    public async process(event: ReferralEventType, referral: Referral, input?: any): Promise<void> {
        if (!referral.referrer.active)
            return;

        let rules = await this.ruleManager.getAll({
            event,
            groupId: referral.referrer.groupId,
            enabled: true
        });

        rules = _.sortBy(rules, r => r.order);

        if (rules.length === 0)
            return;

        const matcher = this.matcherFactory.create(event);
        const matchedRule = await this.matchRule(matcher, rules, referral, input);

        if (!matchedRule)
            return;

        const enabledActions = matchedRule.actions.filter(a => a.enabled);

        if (!enabledActions.length)
            return;

        for (const action of enabledActions) {
            const processor = this.actionProcessorFactory.create(action.type);
            const context: ReferralRuleActionContext = {
                rule: matchedRule,
                referral
            };

            await processor.process(action, context, input);
        }
    }

    private async matchRule(matcher: ReferralRuleMatcher, rules: ReferralRule[], referral: Referral, input?: any): Promise<ReferralRule | undefined> {
        for (const rule of rules)
            if (await matcher.match(rule, referral, input))
                return rule;

        return undefined;
    }
}