import { SubscriptionEntity } from '../subscription.entity';
import { Subscription } from '../../subscription';
import { Singleton } from '../../../core/ioc';

@Singleton
export class SubscriptionEntityMapper {
    public fromEntity(source: SubscriptionEntity): Subscription {
        return {
            id: source.id,
            tierId: source.tierId,
            tierVariantId: source.tierVariantId,
            amount: source.amount,
            currencyCode: source.currencyCode,
            level: source.level,
            period: source.period,
            frequency: source.frequency,
            nextTierId: source.nextTierId,
            nextTierVariantId: source.nextTierVariantId,
            nextTierTime: source.nextTierTime,
            periodStartTime: source.periodStartTime,
            periodEndTime: source.periodEndTime,
            trialling: source.trialling,
            trialStartTime: source.trialStartTime,
            trialEndTime: source.trialEndTime,
            provider: source.provider,
            providerRef: source.providerRef,
            paymentMethodId: source.paymentMethodId,
            skinId: source.skinId,
            status: source.status,
            userId: source.userId,
            activatedTime: source.activatedTime,
            cancelledTime: source.cancelledTime,
            expirationReason: source.expirationReason,
            expireTime: source.expireTime,
            pauseTime: source.pauseTime,
            createTime: source.createTime,
            updateTime: source.updateTime,
        };
    }

    public toEntity(source: Subscription): SubscriptionEntity {
        const entity = new SubscriptionEntity();
        entity.id = source.id;
        entity.tierId = source.tierId;
        entity.tierVariantId = source.tierVariantId;
        entity.amount = source.amount;
        entity.currencyCode = source.currencyCode;
        entity.level = source.level;
        entity.period = source.period;
        entity.frequency = source.frequency;
        entity.nextTierId = source.nextTierId;
        entity.nextTierVariantId = source.nextTierVariantId;
        entity.nextTierTime = source.nextTierTime;
        entity.periodStartTime = source.periodStartTime;
        entity.periodEndTime = source.periodEndTime;
        entity.trialling = source.trialling;
        entity.trialStartTime = source.trialStartTime;
        entity.trialEndTime = source.trialEndTime;
        entity.provider = source.provider;
        entity.providerRef = source.providerRef;
        entity.paymentMethodId = source.paymentMethodId;
        entity.skinId = source.skinId;
        entity.status = source.status;
        entity.userId = source.userId;
        entity.activatedTime = source.activatedTime;
        entity.cancelledTime = source.cancelledTime;
        entity.expirationReason = source.expirationReason;
        entity.expireTime = source.expireTime;
        entity.pauseTime = source.pauseTime;
        return entity;
    }
}