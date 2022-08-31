export interface NewReferralUser {
    userId: number;
    active: boolean;
    code: string;
    slug: string;
    groupId: number;
}

export interface ReferralUserUpdate {
    active: boolean;
    slug: string;
    groupId: number;
}

export interface ReferralUser extends NewReferralUser {
    slug: string;
    revenue: number;
    referralCount: number;
    rewardCount: number;
    diamondCount: number;
    groupId: number;
    createTime: Date;
    updateTime: Date;
}