import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError } from '@tcom/platform/lib/core';
import { UserManager } from '@tcom/platform/lib/user';
import { PaymentStatus } from '@tcom/platform/lib/payment';
import { OrderManager, OrderStatus } from '@tcom/platform/lib/order';
import { PayPalWebhookEvent, PayPalPaymentCapture, PayPalClientFactory } from '@tcom/platform/lib/integration/paypal';
import { PayPalPaymentMethodSynchroniser, PayPalPaymentSynchroniser } from '@tcom/platform/lib/payment/providers/paypal/utilities';
import { NotificationProcessor } from '../notification-processor';

@Singleton
@LogClass()
export class CaptureNotificationProcessor implements NotificationProcessor {
    constructor(
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly clientFactory: PayPalClientFactory,
        @Inject private readonly paymentMethodSynchroniser: PayPalPaymentMethodSynchroniser,
        @Inject private readonly paymentSynchroniser: PayPalPaymentSynchroniser) {
    }

    public async process(notification: PayPalWebhookEvent): Promise<void> {
        Logger.info('Running PayPal Capture Notification Processor:', notification);

        const paypalCapture = notification.resource as PayPalPaymentCapture;
        const paypalOrderId = paypalCapture.supplementary_data?.related_ids?.order_id;

        if (!paypalOrderId)
            throw new NotFoundError(`PayPal payment capture '${paypalCapture.id}' missing order ID.`);

        const client = await this.clientFactory.create();
        const paypalOrder = await client.order.get(paypalOrderId);

        if (!paypalOrder)
            throw new NotFoundError(`PayPal order '${paypalOrderId}' not found.`);

        const purchaseUnit = paypalOrder.purchase_units[0];

        if (!purchaseUnit)
            throw new NotFoundError(`PayPal purchase unit for order '${paypalOrder.id}' not found.`);

        const orderId = Number(purchaseUnit.reference_id);

        if (isNaN(orderId))
            throw new Error(`Invalid order ID ${orderId}`);

        const order = await this.orderManager.get(orderId);

        if (!order)
            throw new NotFoundError(`Order ${orderId} not found.`);

        if (order.status !== OrderStatus.Pending && order.status !== OrderStatus.PendingPayment) {
            Logger.info(`Ignoring payment capture for order with status ${order.status}`);
            return;
        }

        const user = await this.userManager.get(order.userId);

        if (!user)
            throw new NotFoundError(`User ${order.userId} not found.`);

        const paymentMethod = await this.paymentMethodSynchroniser.run(paypalOrder.payer, user.id);
        const payment = await this.paymentSynchroniser.run(paypalCapture, paymentMethod);

        if (payment.status === PaymentStatus.Pending) {
            await this.orderManager.setStatus(order.id, OrderStatus.PendingPayment);
            return;
        }

        if (payment.status !== PaymentStatus.Successful && order.status === OrderStatus.PendingPayment) {
            await this.orderManager.setStatus(order.id, OrderStatus.Expired);
            return;
        }

        if (payment.status !== PaymentStatus.Successful)
            return;

        const totalPaid = await this.orderManager.getTotalPaid(order.id);

        if (totalPaid < order.priceTotal) {
            Logger.info(`Total payments for order ${order.id} of ${totalPaid} ${order.currencyCode} is less than the order amount of ${order.priceTotal} ${order.currencyCode} and will not be completed.`);
            return;
        }

        await this.orderManager.setStatus(order.id, OrderStatus.Paid);
    }
}