import { ReferralUser } from './referral-user';

export interface Referral {
    id: number;
    referrer: ReferralUser;
    referee: ReferralUser;
    revenue: number;
    rewardCount: number;
    diamondCount: number;
    createTime: Date;
    updateTime: Date;
}