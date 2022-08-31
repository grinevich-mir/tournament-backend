import { Referral } from '../referral';
import { ReferralRule } from '../referral-rule';

export interface ReferralRuleMatcher<T extends ReferralRule = ReferralRule, TInput = any> {
    match(rule: T, referral: Referral, input?: TInput): Promise<boolean>;
}