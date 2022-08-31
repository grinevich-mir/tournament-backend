import { UpgradeSubscriptionTierModel } from './upgrade-subscription-tier.model';
import { UpgradeSubscriptionPromoModel } from './upgrade-subscription-promo.model';

export interface UpgradeSubscriptionTiersModel {
    currentTierId: number;
    currentLevel: number;
    nextTierId?: number;
    nextTierVariantId?: number;
    nextLevel?: number;
    nextTierTime?: Date;
    promo?: UpgradeSubscriptionPromoModel;
    tiers: UpgradeSubscriptionTierModel[];
}