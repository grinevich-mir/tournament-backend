import { Singleton, IocContainer } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ReferralRuleActionType } from '../referral-rule-action-type';
import { ReferralRuleActionProcessor } from './referral-rule-action-processor';
import { AwardDiamondsActionProcessor, ChangeGroupActionProcessor } from './actions';

@Singleton
@LogClass()
export class ReferralRuleActionProcessorFactory {
    public create(type: ReferralRuleActionType): ReferralRuleActionProcessor {
        switch (type) {
            case ReferralRuleActionType.AwardDiamonds:
                return IocContainer.get(AwardDiamondsActionProcessor);

            case ReferralRuleActionType.ChangeGroup:
                return IocContainer.get(ChangeGroupActionProcessor);
        }
    }
}