import { PaymentProvider } from '../../payment';
import { SubscriptionPeriod } from '../subscription-period';
import { SubscriptionStatus } from '../subscription-status';

export interface SubscriptionModel {
    level: number;
    tierId: number;
    tierName: string;
    tierVariantId: number;
    provider: PaymentProvider;
    status: SubscriptionStatus;
    currencyCode: string;
    amount: number;
    frequency: number;
    period: SubscriptionPeriod;
    paymentMethodId: number;
    startTime: Date;
    endTime: Date;
    pauseTime?: Date;
    /**
     * @isInt pauseCycles
     */
    expireTime?: Date;
    trialling: boolean;
    trialStartTime?: Date;
    trialEndTime?: Date;
    activatedTime?: Date;
    cancelledTime?: Date;
    nextTierId?: number;
    nextTierVariantId?: number;
    nextTierTime?: Date;
    createTime: Date;
    updateTime: Date;
}