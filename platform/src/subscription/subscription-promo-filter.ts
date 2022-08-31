export interface SubscriptionPromoFilter {
    skinId?: string;
    enabled?: boolean;
    skip?: number;
    take?: number;
}

export interface SubscriptionPromoUsageFilter {
    userId?: string;
    subscriptionId?: number;
    expired?: boolean;
    skip?: number;
    take?: number;
}