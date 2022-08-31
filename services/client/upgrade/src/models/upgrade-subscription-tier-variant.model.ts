import { SubscriptionPeriod } from '@tcom/platform/lib/subscription';
import { UpgradeSubscriptionTierPricesModel } from './upgrade-subscription-tier.model';

export interface UpgradeSubscriptionTierVariantModel {
    id: number;
    name: string;
    period: SubscriptionPeriod;
    frequency: number;
    trialPeriod?: SubscriptionPeriod;
    trialDuration?: number;
    prices: UpgradeSubscriptionTierPricesModel;
}