import { CouponProduct, CouponRestrictions } from './models';

export interface Coupon {
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

export interface NewCoupon {
    name: string;
    validFrom: Date;
    validTo?: Date;
    code: string;
    amountOff?: number;
    percentOff?: number;
    bonusItems?: CouponProduct[];
    restrictions?: CouponRestrictions;
}

export interface CouponUpdate {
    name: string;
    validFrom: Date;
    validTo?: Date;
    code: string;
    amountOff?: number;
    percentOff?: number;
    bonusItems?: CouponProduct[];
    restrictions?: CouponRestrictions;
}