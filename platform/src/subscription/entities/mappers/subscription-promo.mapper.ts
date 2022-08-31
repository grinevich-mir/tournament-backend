import { SubscriptionPromoEntity } from '../subscription-promo.entity';
import { SubscriptionPromo } from '../../subscription-promo';
import { SubscriptionPromoUsageEntity } from '../subscription-promo-usage.entity';
import { SubscriptionPromoUsage } from '../../subscription-promo-usage';
import { Singleton } from '../../../core/ioc';

@Singleton
export class SubscriptionPromoEntityMapper {
    public fromEntity(source: SubscriptionPromoEntity): SubscriptionPromo {
        return {
            id: source.id,
            cycles: source.cycles,
            period: source.period,
            expireIn: source.expireIn,
            onCancellation: source.onCancellation,
            onDowngrade: source.onDowngrade,
            skinId: source.skinId,
            enabled: source.enabled,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public usageFromEntity(source: SubscriptionPromoUsageEntity): SubscriptionPromoUsage {
        return {
            id: source.id,
            accepted: source.accepted,
            promoId: source.promoId,
            subscriptionId: source.subscriptionId,
            userId: source.userId,
            expireTime: source.expireTime,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}