export interface ReferralModel {
    id: number;
    displayName: string;
    active: boolean;
    revenue: number;
    rewardCount: number;
    diamondCount: number;
    createTime: Date;
    updateTime: Date;
}