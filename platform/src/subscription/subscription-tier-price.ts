export interface SubscriptionTierPrice {
    variantId: number;
    currencyCode: string;
    amount: number;
    trialAmount: number;
    enabled: boolean;
    createTime: Date;
    updateTime: Date;
}