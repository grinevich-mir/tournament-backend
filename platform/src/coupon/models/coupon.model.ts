export interface CouponRestrictions {
    minPurchase?: number;
    firstTransaction?: boolean;
    maxRedemptionsPerCoupon?: number;
    maxRedemptionsPerUser?: number;
}

export interface CouponProduct {
    id: number;
    description: string;
    quantity: number;
    price: number;
}

export interface CouponModel {
    id: number;
    name: string;
    validFrom: Date;
    validTo?: Date;
    code: string;
    amountOff?: number;
    percentOff?: number;
    bonusItems?: CouponProduct[];
    restrictions?: CouponRestrictions;
    redemptionCount: number;
    createTime: Date;
    updateTime: Date;
}