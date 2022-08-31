import { ReferralRuleAction } from '../referral-rule-action';
import { ReferralRuleActionContext } from './referral-rule-action-context';

export interface ReferralRuleActionProcessor<T extends ReferralRuleAction = ReferralRuleAction, TInput = any> {
    process(action: T, context: ReferralRuleActionContext, input: TInput): Promise<void>;
}