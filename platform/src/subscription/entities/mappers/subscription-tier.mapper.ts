import { SubscriptionTierEntity } from '../subscription-tier.entity';
import { SubscriptionTier } from '../../subscription-tier';
import { SubscriptionTierPriceEntity } from '../subscription-tier-price.entity';
import { SubscriptionTierPrice } from '../../subscription-tier-price';
import { Singleton } from '../../../core/ioc';
import { SubscriptionTierVariantEntity } from '../subscription-tier-variant.entity';
import { SubscriptionTierVariant } from '../../subscription-tier-variant';

@Singleton
export class SubscriptionTierEntityMapper {
    public fromEntity(source: SubscriptionTierEntity): SubscriptionTier {
        return {
            id: source.id,
            name: source.name,
            skinId: source.skinId,
            code: source.code,
            enabled: source.enabled,
            level: source.level,
            variants: source.variants.map(e => this.variantFromEntity(e)),
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public variantFromEntity(source: SubscriptionTierVariantEntity): SubscriptionTierVariant {
        return {
            id: source.id,
            tierId: source.tierId,
            name: source.name,
            code: source.code,
            period: source.period,
            frequency: source.frequency,
            trialEnabled: source.trialEnabled,
            trialPeriod: source.trialPeriod,
            trialDuration: source.trialDuration,
            default: source.default,
            prices: source.prices.map(e => this.priceFromEntity(e)),
            enabled: source.enabled,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public priceFromEntity(source: SubscriptionTierPriceEntity): SubscriptionTierPrice {
        return {
            variantId: source.variantId,
            currencyCode: source.currencyCode,
            amount: source.amount,
            trialAmount: source.trialAmount,
            enabled: source.enabled,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}