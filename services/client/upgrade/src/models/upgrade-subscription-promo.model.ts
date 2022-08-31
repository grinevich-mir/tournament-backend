import { SubscriptionPeriod } from '@tcom/platform/lib/subscription/subscription-period';

export interface UpgradeSubscriptionPromoModel {
    cycles: number;
    period: SubscriptionPeriod;
    onDowngrade: boolean;
    onCancellation: boolean;
}