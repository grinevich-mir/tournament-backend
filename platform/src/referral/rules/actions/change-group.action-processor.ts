import { Singleton, Inject } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { ReferralRuleActionProcessor } from '../referral-rule-action-processor';
import { ChangeGroupReferralRuleAction } from '../../referral-rule-action';
import { ReferralUserManager } from '../../referral-user-manager';
import { ReferralRuleActionContext } from '../referral-rule-action-context';
import { ReferralTarget } from '../../referral-target';

@Singleton
@LogClass()
export class ChangeGroupActionProcessor implements ReferralRuleActionProcessor<ChangeGroupReferralRuleAction> {
    constructor(
        @Inject private readonly userManager: ReferralUserManager) {
    }

    public async process(action: ChangeGroupReferralRuleAction, context: ReferralRuleActionContext): Promise<void> {
        const target = action.target === ReferralTarget.Referee ? context.referral.referee : context.referral.referrer;
        await this.userManager.setGroupId(target.userId, action.groupId);
    }
}