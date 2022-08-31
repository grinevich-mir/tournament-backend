import { SubscriptionPeriod } from '@tcom/platform/lib/subscription';

export interface NewSubscriptionTierModel {
    skinId: string;
    code: string;
    name: string;
    period?: SubscriptionPeriod;
    frequency?: number;
}