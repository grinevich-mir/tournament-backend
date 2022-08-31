import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { PaymentStatusChangedEvent } from '@tcom/platform/lib/payment/events';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { PaymentStatus, PaymentType } from '@tcom/platform/lib/payment';
import { UserManager } from '@tcom/platform/lib/user';
import { Voluum } from '@tcom/platform/lib/integration/voluum';

const ALLOWED_PAYMENT_TYPES: PaymentType[] = [
    PaymentType.Purchase,
];

@Singleton
@LogClass()
class OnPaymentStatusChangeHandler extends PlatformEventHandler<PaymentStatusChangedEvent> {

    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly voluum: Voluum) {
        super();
    }

    protected async process(event: Readonly<PaymentStatusChangedEvent>): Promise<void> {
        const payment = event.payment;

        if (!ALLOWED_PAYMENT_TYPES.includes(payment.type))
            return;

        if (event.to !== PaymentStatus.Successful)
            return;

        const user = await this.userManager.get(payment.userId);

        if (!user || !user.clickId)
            return;

        await this.voluum.sendPurchaseEvent(user.clickId, payment.amount.toString(), event.payment.id.toString());

        Logger.info('Voluum', 'Purchase event sent');
    }

}

export const onPaymentStatusChange = lambdaHandler((event: SNSEvent) => IocContainer.get(OnPaymentStatusChangeHandler).execute(event));