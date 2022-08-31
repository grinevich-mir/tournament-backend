import { UpgradeSubscriptionTierVariantModel } from './upgrade-subscription-tier-variant.model';

export interface UpgradeSubscriptionTierModel {
    id: number;
    name: string;
    level: number;
    variants?: UpgradeSubscriptionTierVariantModel[];
}

/**
 * @example
 * {
 *  "GBP": 9.99,
 *  "USD": 12.99,
 *  "EUR": 10.99,
 *  "INR": 500
 * }
 */
export interface UpgradeSubscriptionTierPricesModel {
    [currencyCode: string]: {
        amount: number;
        trialAmount?: number;
    };
}