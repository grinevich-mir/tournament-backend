export interface NewReferralCommissionRate {
    rate: number;
    minAmount?: number;
    maxAmount?: number;
}

export interface ReferralCommissionRateUpdate extends Omit<NewReferralCommissionRate, 'groupId'> {
    enabled: boolean;
}

export interface ReferralCommissionRate extends Omit<NewReferralCommissionRate, 'minAmount'> {
    level: number;
    groupId: number;
    minAmount: number;
    enabled: boolean;
    createTime: Date;
    updateTime: Date;
}