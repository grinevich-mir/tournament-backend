import { ReferralRewardType, ReferralEventType, ReferralCommissionType } from '@tcom/platform/lib/referral';
import { ReferralModel } from './referral.model';

interface ReferralRewardModelBase {
    id: number;
    type: ReferralRewardType;
    event: ReferralEventType;
    referral: ReferralModel;
    createTime: Date;
}

interface DiamondsReferralRewardModelBase {
    type: ReferralRewardType.Diamonds;
    amount: number;
}

interface CommissionReferralRewardModelBase {
    type: ReferralRewardType.Commission;
    level: number;
    sourceAmount: number;
    sourceType: ReferralCommissionType;
    rate: number;
    commission: number;
}

export type DiamondsReferralRewardModel = DiamondsReferralRewardModelBase & ReferralRewardModelBase;
export type CommissionReferralRewardModel = CommissionReferralRewardModelBase & ReferralRewardModelBase;

export type ReferralRewardModel = DiamondsReferralRewardModel | CommissionReferralRewardModel;