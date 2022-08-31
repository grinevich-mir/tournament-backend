import { PaymentProvider } from '../payment';
import { SubscriptionPeriod } from './subscription-period';
import { SubscriptionStatus } from './subscription-status';

export interface Subscription {
    id: number;
    userId: number;
    skinId: string;
    provider: PaymentProvider;
    providerRef: string;
    status: SubscriptionStatus;
    currencyCode: string;
    amount: number;
    tierId: number;
    tierVariantId: number;
    level: number;
    period: SubscriptionPeriod;
    frequency: number;
    paymentMethodId: number;
    nextTierId?: number;
    nextTierVariantId?: number;
    nextTierTime?: Date;
    periodStartTime: Date;
    periodEndTime: Date;
    trialling: boolean;
    trialStartTime?: Date;
    trialEndTime?: Date;
    activatedTime?: Date;
    expireTime?: Date;
    expirationReason?: string;
    pauseTime?: Date;
    cancelledTime?: Date;
    createTime: Date;
    updateTime: Date;
}