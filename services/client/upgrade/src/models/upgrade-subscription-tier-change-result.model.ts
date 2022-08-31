import { UpgradeSubscriptionPromoModel } from './upgrade-subscription-promo.model';

export interface UpgradeSubscriptionTierChangeResultModel {
    level?: number;
    nextLevel?: number;
    nextTierId?: number;
    nextTierTime?: Date;
    promo?: UpgradeSubscriptionPromoModel;
}