import { ReferralRewardType } from './referral-reward-type';
import { ReferralCommissionType } from './referral-commission-type';
import { ReferralEventType } from './referral-event-type';
import { Referral } from './referral';

interface NewReferralRewardBase {
    type: ReferralRewardType;
    event: ReferralEventType;
    userId: number;
    referralId: number;
}

interface ReferralRewardBase extends NewReferralRewardBase {
    id: number;
    type: ReferralRewardType;
    referral: Referral;
    createTime: Date;
}

interface DiamondsReferralRewardBase {
    type: ReferralRewardType.Diamonds;
    amount: number;
    walletEntryId: number;
}

interface CommissionReferralRewardBase {
    type: ReferralRewardType.Commission;
    level: number;
    sourceAmount: number;
    sourceType: ReferralCommissionType;
    sourceId: number;
    rate: number;
    commission: number;
    walletEntryId: number;
}

export type NewDiamondsReferralReward = DiamondsReferralRewardBase & NewReferralRewardBase;
export type NewCommissionReferralReward = CommissionReferralRewardBase & NewReferralRewardBase;

export type DiamondsReferralReward = DiamondsReferralRewardBase & ReferralRewardBase;
export type CommissionReferralReward = CommissionReferralRewardBase & ReferralRewardBase;

export type NewReferralReward = NewDiamondsReferralReward | NewCommissionReferralReward;
export type ReferralReward = DiamondsReferralReward | CommissionReferralReward;