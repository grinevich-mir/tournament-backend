import { ReferralRuleMatcher } from '../referral-rule-matcher';
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { Referral } from '../../referral';
import { ReferralPaymentReferralRule } from '../../referral-rule';
import { Payment } from '../../../payment';

@Singleton
@LogClass()
export class ReferralPaymentMatcher implements ReferralRuleMatcher<ReferralPaymentReferralRule, Payment> {
    public async match(rule: ReferralPaymentReferralRule, referral: Referral, input: Payment): Promise<boolean> {
        const amountMatch = this.checkAmount(rule, input);

        if (rule.minRevenue && referral.referrer.revenue >= rule.minRevenue)
            return amountMatch;

        return amountMatch;
    }

    private checkAmount(rule: ReferralPaymentReferralRule, payment: Payment): boolean {
        if (rule.minAmount)
            return payment.amount >= rule.minAmount;

        return true;
    }
}