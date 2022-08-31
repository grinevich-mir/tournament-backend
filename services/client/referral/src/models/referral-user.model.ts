import { ReferralGroupModel } from './referral-group.model';

export interface ReferralUserModel {
    referralCount: number;
    revenue: number;
    rewardCount: number;
    diamondCount: number;
    active: boolean;
    code: string;
    slug: string;
    group: ReferralGroupModel;
}