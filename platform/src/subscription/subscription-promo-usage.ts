export interface SubscriptionPromoUsage {
    id: number;
    promoId: number;
    userId: number;
    subscriptionId: number;
    accepted: boolean;
    expireTime: Date;
    createTime: Date;
    updateTime: Date;
}