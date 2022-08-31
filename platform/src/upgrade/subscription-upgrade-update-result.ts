import { Subscription, SubscriptionTier } from '../subscription';
import { SubscriptionUpgrade } from './upgrade';

export interface SubscriptionUpgradeUpdateResult {
    level: number;
    upgrade: SubscriptionUpgrade;
    subscription: Subscription;
    nextTier?: SubscriptionTier;
    nextTierTime?: Date;
}