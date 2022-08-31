import { Singleton, Inject } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { ReferralRuleActionProcessor } from '../referral-rule-action-processor';
import { AwardDiamondsReferralRuleAction } from '../../referral-rule-action';
import { Ledger, TransactionPurpose, RequesterType, PlatformWallets, UserWalletAccounts } from '../../../banking';
import { ReferralManager } from '../../referral-manager';
import { ReferralRewardType } from '../../referral-reward-type';
import { ReferralRuleActionContext } from '../referral-rule-action-context';
import { ReferralTarget } from '../../referral-target';

@Singleton
@LogClass()
export class AwardDiamondsActionProcessor implements ReferralRuleActionProcessor<AwardDiamondsReferralRuleAction> {
    constructor(
        @Inject private readonly ledger: Ledger,
        @Inject private readonly referralManager: ReferralManager) {
    }

    public async process(action: AwardDiamondsReferralRuleAction, context: ReferralRuleActionContext): Promise<void> {
        const target = action.target === ReferralTarget.Referee ? context.referral.referee : context.referral.referrer;

        const entry = await this.ledger.transfer(action.amount, 'DIA')
            .purpose(TransactionPurpose.ReferralPayout)
            .requestedBy(RequesterType.System, 'Referral')
            .memo(`Referral action ${action.type}, rule: ${context.rule.id}, referral: ${context.referral.id}`)
            .fromPlatform(PlatformWallets.Referral)
            .toUser(target.userId, UserWalletAccounts.Diamonds)
            .commit();

        await this.referralManager.addReward({
            type: ReferralRewardType.Diamonds,
            amount: action.amount,
            event: context.rule.event,
            referralId: context.referral.id,
            userId: target.userId,
            walletEntryId: entry.id
        });
    }
}