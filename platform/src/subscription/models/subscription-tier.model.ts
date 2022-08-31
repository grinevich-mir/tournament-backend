import { SubscriptionPeriod } from '../subscription-period';

export interface SubscriptionTierModel {
    code: string;
    name: string;
    period: SubscriptionPeriod;
    frequency: number;
    triallable: boolean;
    prices: SubscriptionTierPriceModel[];
}

export interface SubscriptionTierPriceModel {
    currencyCode: string;
    amount: number;
}