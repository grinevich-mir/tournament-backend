import { PaymentProvider } from '@tcom/platform/lib/payment';
import { Subscription, SubscriptionStatus, SubscriptionTier, SubscriptionPeriod } from '@tcom/platform/lib/subscription';
import { SubscriptionModel } from '@tcom/platform/lib/subscription/models';

export function generateSubscription(id: number = 1): Subscription {
    return {
        id,
        amount: 10,
        currencyCode: 'USD',
        level: 1,
        period: SubscriptionPeriod.Month,
        frequency: 1,
        provider: PaymentProvider.Chargify,
        providerRef: 'ABC12345',
        skinId: 'tournament',
        status: SubscriptionStatus.Active,
        paymentMethodId: 1,
        tierId: 1,
        tierVariantId: 1,
        updateTime: new Date(),
        userId: 1,
        activatedTime: new Date(),
        periodEndTime: new Date(),
        periodStartTime: new Date(),
        trialling: false,
        createTime: new Date()
    };
}

export function generateSubscriptionModel(id: number = 1): SubscriptionModel {
    return {
        tierId: id,
        tierVariantId: 1,
        tierName: `Tier ${id}`,
        amount: 10,
        currencyCode: 'USD',
        level: 1,
        period: SubscriptionPeriod.Day,
        frequency: 1,
        provider: PaymentProvider.Chargify,
        paymentMethodId: 1,
        status: SubscriptionStatus.Active,
        startTime: new Date(),
        endTime: new Date(),
        trialling: false,
        updateTime: new Date(),
        activatedTime: new Date(),
        createTime: new Date()
    };
}

export function generateSubscriptionTier(id: number = 1, level: number = 1): SubscriptionTier {
    return {
        id,
        code: `Tier${level}`,
        enabled: true,
        level,
        name: `Tier ${level}`,
        variants: [
            {
                id: 1,
                tierId: id,
                code: 'default',
                name: 'Default',
                default: true,
                enabled: true,
                period: SubscriptionPeriod.Month,
                frequency: 1,
                trialEnabled: false,
                trialPeriod: SubscriptionPeriod.Day,
                trialDuration: 1,
                prices: [
                    {
                        variantId: 1,
                        amount: 10,
                        trialAmount: 0,
                        currencyCode: 'USD',
                        enabled: true,
                        createTime: new Date(),
                        updateTime: new Date()
                    }
                ],
                createTime: new Date(),
                updateTime: new Date()
            }
        ],
        skinId: 'tournament',
        createTime: new Date(),
        updateTime: new Date()
    };
}