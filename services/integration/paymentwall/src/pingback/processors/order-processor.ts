import { NotFoundError } from '@tcom/platform/lib/core';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { PaymentwallPingback } from '@tcom/platform/lib/integration/paymentwall';
import { PaymentwallPaymentGateway } from '@tcom/platform/lib/payment/providers/paymentwall';
import { UserManager } from '@tcom/platform/lib/user';
import { OrderManager, OrderStatus } from '@tcom/platform/lib/order';
import { PaymentStatus } from '@tcom/platform/lib/payment';
import { PingbackProcessor } from '../pingback-processor';

@Singleton
@LogClass()
export class OrderProcessor implements PingbackProcessor {
    constructor(
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly paymentGateway: PaymentwallPaymentGateway) {
    }

    public async process(pingback: PaymentwallPingback): Promise<void> {
        Logger.info('Running Paymentwall Order Processor:', pingback);

        if (!pingback.referenceId)
            throw new NotFoundError('Paymentwall pingback missing reference ID.');

        if (!pingback.orderId)
            throw new NotFoundError('Paymentwall pingback missing order ID.');

        const orderId = Number(pingback.orderId);

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

        const payment = await this.paymentGateway.completePayment(
            user,
            order.id.toString(),
            {
                referenceId: pingback.referenceId,
                paymentType: pingback.paymentType,
                paymentMethodToken: pingback.paymentMethodToken
            }
        );

        await this.orderManager.addPayment(order, payment);

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