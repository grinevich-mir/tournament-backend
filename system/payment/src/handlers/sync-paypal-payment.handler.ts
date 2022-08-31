import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { lambdaHandler, NotFoundError, ForbiddenError } from '@tcom/platform/lib/core';
import { PaymentManager, PaymentProvider, PaymentMethodManager } from '@tcom/platform/lib/payment';
import { PayPalClientFactory } from '@tcom/platform/lib/integration/paypal';
import { PayPalPaymentSynchroniser } from '@tcom/platform/lib/payment/providers/paypal/utilities';

interface Event {
    paymentId: number;
}

@Singleton
@LogClass()
export class SyncPayPalPaymentHandler {
    constructor(
        @Inject private readonly paymentManager: PaymentManager,
        @Inject private readonly paymentMethodManager: PaymentMethodManager,
        @Inject private readonly clientFactory: PayPalClientFactory,
        @Inject private readonly paymentSynchroniser: PayPalPaymentSynchroniser) {
        }

    public async execute(event: Event): Promise<void> {
        const payment = await this.paymentManager.get(event.paymentId);

        if (!payment)
            throw new NotFoundError('Payment not found.');

        if (payment.provider !== PaymentProvider.PayPal)
            throw new ForbiddenError('Payment is not a PayPal payment.');

        const client = await this.clientFactory.create();
        const payPalCapture = await client.payment.getCaptureDetails(payment.providerRef);

        if (!payPalCapture)
            throw new NotFoundError(`PayPal payment ${payment.providerRef} not found.`);

        const paymentMethod = await this.paymentMethodManager.get(payment.paymentMethodId);

        if (!paymentMethod)
            throw new NotFoundError(`Could not find payment method ${payment.paymentMethodId}`);

        await this.paymentSynchroniser.run(payPalCapture, paymentMethod);
    }
}

export const syncPayPalPayment = lambdaHandler((event: Event) => IocContainer.get(SyncPayPalPaymentHandler).execute(event));