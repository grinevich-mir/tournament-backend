import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError } from '@tcom/platform/lib/core';
import { UserManager } from '@tcom/platform/lib/user';
import { PayPalOrder, PayPalWebhookEvent } from '@tcom/platform/lib/integration/paypal';
import { PayPalPaymentGateway } from '@tcom/platform/lib/payment/providers/paypal';
import { OrderManager, OrderStatus } from '@tcom/platform/lib/order';
import { PaymentStatus } from '@tcom/platform/lib/payment';
import { NotificationProcessor } from '../notification-processor';

@Singleton
@LogClass()
export class OrderNotificationProcessor implements NotificationProcessor {
    constructor(
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly paymentGateway: PayPalPaymentGateway) {
    }

    public async process(notification: PayPalWebhookEvent): Promise<void> {
        Logger.info('Running PayPal Order Notification Processor:', notification);

        const resource = notification.resource as PayPalOrder;
        const purchaseUnit = resource.purchase_units[0];

        if (!purchaseUnit)
            throw new NotFoundError(`PayPal purchase unit for order '${resource.id}' not found.`);

        const orderId = Number(purchaseUnit.reference_id);

        if (isNaN(orderId))
            throw new Error(`Invalid order ID ${orderId}`);

        const order = await this.orderManager.get(orderId);

        if (!order)
            throw new NotFoundError(`Order ${orderId} not found.`);

        if (order.status !== OrderStatus.Pending) {
            Logger.warn(`Order ${orderId} is ${order.status}, aborting.`);
            return;
        }

        const user = await this.userManager.get(order.userId);

        if (!user)
            throw new NotFoundError(`User ${order.userId} not found.`);

        const payment = await this.paymentGateway.completePayment(user, order.id.toString(), { token: resource.id });

        await this.orderManager.addPayment(order, payment);

        if (payment.status === PaymentStatus.Pending) {
            await this.orderManager.setStatus(order.id, OrderStatus.PendingPayment);
            return;
        }

        if (payment.status !== PaymentStatus.Successful)
            return;

        const totalPaid = await this.orderManager.getTotalPaid(order);

        if (totalPaid < order.priceTotal) {
            Logger.info(`Total payments for order ${order.id} of ${totalPaid} ${order.currencyCode} is less than the order amount of ${order.priceTotal} ${order.currencyCode} and will not be completed.`);
            return;
        }

        await this.orderManager.setStatus(order.id, OrderStatus.Paid);
    }
}