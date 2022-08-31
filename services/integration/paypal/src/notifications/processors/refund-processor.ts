import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError } from '@tcom/platform/lib/core';
import { PaymentManager, PaymentProvider } from '@tcom/platform/lib/payment';
import { PayPalClientFactory, PayPalLinkRelationType, PayPalOrderStatus, PayPalPaymentStatus, PayPalRefund, PayPalWebhookEvent } from '@tcom/platform/lib/integration/paypal';
import { NotificationProcessor } from '../notification-processor';

@Singleton
@LogClass()
export class RefundNotificationProcessor implements NotificationProcessor {
    constructor(
        @Inject private readonly clientFactory: PayPalClientFactory,
        @Inject private readonly paymentManager: PaymentManager) {
    }

    public async process(notification: PayPalWebhookEvent): Promise<void> {
        Logger.info('Running PayPal Refund Notification Processor:', notification);

        const paypalRefund = notification.resource as PayPalRefund;

        if (paypalRefund.status !== PayPalOrderStatus.Completed)
            return;

        const client = await this.clientFactory.create();
        const captureId = this.getCaptureId(paypalRefund);
        const capturedPayment = await client.payment.getCaptureDetails(captureId);

        if (!capturedPayment)
            throw new NotFoundError(`PayPal capture for ID '${captureId}'' not found.`);

        if (capturedPayment.status !== PayPalPaymentStatus.Refunded)
            return;

        const payment = await this.paymentManager.getByProviderRef(PaymentProvider.PayPal, capturedPayment.id);

        if (!payment)
            throw new NotFoundError(`Platform payment for providerRef ${capturedPayment.id} not found.`);

        await this.paymentManager.refund(payment.id, paypalRefund.note_to_payer);
    }

    private getCaptureId(refund: PayPalRefund): string {
        const captureLink = refund.links.find(l => l.rel === PayPalLinkRelationType.Up);

        if (!captureLink)
            throw new NotFoundError(`PayPal capture link '${PayPalLinkRelationType.Up}' not found.`);

        Logger.info('Found PayPal Capture Link:', captureLink);

        const parts = captureLink.href.split('/');
        const id = parts[parts.length - 1];

        Logger.info(`PayPal Payment Capture ID: ${id}`);
        return id;
    }
}