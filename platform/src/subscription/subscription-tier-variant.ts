import { SubscriptionPeriod } from './subscription-period';
import { SubscriptionTierPrice } from './subscription-tier-price';

export interface SubscriptionTierVariant {
    id: number;
    name: string;
    code: string;
    tierId: number;
    period: SubscriptionPeriod;
    frequency: number;
    trialEnabled: boolean;
    trialPeriod: SubscriptionPeriod;
    trialDuration: number;
    prices: SubscriptionTierPrice[];
    default: boolean;
    enabled: boolean;
    createTime: Date;
    updateTime: Date;
}