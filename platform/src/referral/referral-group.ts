export interface NewReferralGroup {
    name: string;
}

export interface ReferralGroupUpdate extends NewReferralGroup {
}

export interface ReferralGroup extends NewReferralGroup {
    id: number;
    default: boolean;
    createTime: Date;
    updateTime: Date;
}