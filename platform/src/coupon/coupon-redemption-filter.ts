import { Coupon } from '.';
import { PagedFilter } from '../core';

export interface CouponRedemptionFilter extends PagedFilter<Coupon> {
    couponId?: number;
}