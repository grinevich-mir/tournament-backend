import { SubscriptionModel } from '@tcom/platform/lib/subscription/models';

export interface UpgradeSubscriptionCreateResultModel {
    userLevel: number;
    subscription: SubscriptionModel;
}