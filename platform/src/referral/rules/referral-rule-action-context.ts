import { Referral } from '../referral';
import { ReferralRule } from '../referral-rule';

export interface ReferralRuleActionContext {
    rule: ReferralRule;
    referral: Referral;
}