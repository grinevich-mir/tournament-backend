export interface CouponRedemption {
    id: number;
    couponId: number;
    userId: number;
    orderId: number;
    createTime: Date;
    updateTime: Date;
}

export interface NewCouponRedemption {
    couponId: number;
    userId: number;
    orderId: number;
}