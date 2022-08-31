import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { ReferralEventType, ReferralManager, ReferralRuleProcessor, ReferralCommissionProcessor } from '@tcom/platform/lib/referral';
import { PaymentStatusChangedEvent } from '@tcom/platform/lib/payment/events';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { PaymentStatus, PaymentType } from '@tcom/platform/lib/payment';

const ALLOWED_PAYMENT_TYPES: PaymentType[] = [
    PaymentType.Purchase,
    PaymentType.Subscription
];

@Singleton
@LogClass()
class OnPaymentStatusChangedHandler extends PlatformEventHandler<PaymentStatusChangedEvent> {
    constructor(
        @Inject private readonly referralManager: ReferralManager,
        @Inject private readonly ruleProcessor: ReferralRuleProcessor,
        @Inject private readonly commissionProcessor: ReferralCommissionProcessor) {
            super();
    }

    protected async process(event: Readonly<PaymentStatusChangedEvent>): Promise<void> {
        const payment = event.payment;

        if (!ALLOWED_PAYMENT_TYPES.includes(payment.type))
            return;

        if (event.to !== PaymentStatus.Successful)
            return;

        const referral = await this.referralManager.getByReferee(payment.userId);

        if (!referral) {
            Logger.info('No referral found, ignoring.');
            return;
        }

        await this.commissionProcessor.process(referral, payment);
        await this.ruleProcessor.process(ReferralEventType.Payment, referral, payment);
    }
}

export const onPaymentStatusChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnPaymentStatusChangedHandler).execute(event));