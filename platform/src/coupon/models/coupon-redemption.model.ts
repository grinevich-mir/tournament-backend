export interface CouponRedemptionModel {
    id: number;
    couponId: number;
    userId: number;
    orderId: number;
    createTime: Date;
    updateTime: Date;
}