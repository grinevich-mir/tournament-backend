import { Singleton, IocContainer } from '../../core/ioc';
import { ReferralEventType } from '../referral-event-type';
import { ReferralRuleMatcher } from './referral-rule-matcher';
import { LogClass } from '../../core/logging';
import { ReferralSignUpMatcher, ReferralPaymentMatcher } from './matchers';

@Singleton
@LogClass()
export class ReferralRuleMatcherFactory {
    public create(trigger: ReferralEventType): ReferralRuleMatcher {
        switch (trigger) {
            case ReferralEventType.SignUp:
                return IocContainer.get(ReferralSignUpMatcher);

            case ReferralEventType.Payment:
                return IocContainer.get(ReferralPaymentMatcher);
        }
    }
}