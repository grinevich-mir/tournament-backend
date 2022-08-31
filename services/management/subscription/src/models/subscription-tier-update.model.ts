import { SubscriptionPeriod } from '@tcom/platform/lib/subscription';

export interface SubscriptionTierUpdateModel {
    name: string;
    period: SubscriptionPeriod;
    frequency: number;
}