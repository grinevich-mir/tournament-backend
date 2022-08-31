import { Singleton } from '../../core/ioc';
import { SubscriptionModel } from './subscription.model';
import { Subscription } from '../subscription';
import { SubscriptionTier } from '../subscription-tier';

@Singleton
export class SubscriptionModelMapper {
    public map(source: Subscription, tier: SubscriptionTier): SubscriptionModel {
        return {
            level: source.level,
            tierId: source.tierId,
            tierVariantId: source.tierVariantId,
            tierName: tier.name,
            currencyCode: source.currencyCode,
            amount: source.amount,
            frequency: source.frequency,
            period: source.period,
            provider: source.provider,
            paymentMethodId: source.paymentMethodId,
            status: source.status,
            startTime: source.periodStartTime,
            endTime: source.periodEndTime,
            trialling: source.trialling,
            trialStartTime: source.trialStartTime,
            trialEndTime: source.trialEndTime,
            pauseTime: source.pauseTime,
            cancelledTime: source.cancelledTime,
            expireTime: source.expireTime,
            activatedTime: source.activatedTime,
            nextTierId: source.nextTierId,
            nextTierVariantId: source.nextTierVariantId,
            nextTierTime: source.nextTierTime,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}