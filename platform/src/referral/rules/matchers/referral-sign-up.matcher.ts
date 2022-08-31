import { ReferralRuleMatcher } from '../referral-rule-matcher';
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { Referral } from '../../referral';
import { ReferralSignUpReferralRule } from '../../referral-rule';

@Singleton
@LogClass()
export class ReferralSignUpMatcher implements ReferralRuleMatcher<ReferralSignUpReferralRule> {
    public async match(rule: ReferralSignUpReferralRule, referral: Referral): Promise<boolean> {
        if (rule.every && referral.referrer.referralCount % rule.count === 0)
            return true;

        if (referral.referrer.referralCount === rule.count)
            return true;

        return false;
    }
}