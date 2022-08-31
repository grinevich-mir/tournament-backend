import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { NotFoundError } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { OrderManager, OrderStatus } from '@tcom/platform/lib/order';
import { UserManager } from '@tcom/platform/lib/user';
import { PaymentStatus } from '@tcom/platform/lib/payment';
import { SkrillStatusReport, SkrillTransactionStatus, SkrillTransaction } from '@tcom/platform/lib/integration/skrill';
import { SkrillTransactionProcessor } from '@tcom/platform/lib/payment/providers/skrill/utilities';
import { NotificationProcessor } from '../notification-processor';

@Singleton
@LogClass()
export class OrderNotificationProcessor implements NotificationProcessor {
    constructor(
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly transactionProcessor: SkrillTransactionProcessor,
        @Inject private readonly userManager: UserManager) {
    }

    public async process(report: SkrillStatusReport): Promise<void> {
        Logger.info('Running Skrill Order Notification Processor:', report);

        if (report.status !== SkrillTransactionStatus.Processed && report.status !== SkrillTransactionStatus.Failed)
            return;

        const orderId = Number(report.transaction_id);

        if (isNaN(orderId))
            throw new Error(`Invalid order ID ${orderId}`);

        const order = await this.orderManager.get(orderId);

        if (!order)
            throw new Error(`Order ${orderId} not found.`);

        const user = await this.userManager.get(order.userId);

        if (!user)
            throw new NotFoundError(`User ${order.userId} not found.`);

        const transaction: SkrillTransaction = {
            id: report.mb_transaction_id,
            amount: report.amount,
            currencyCode: report.currency,
            status: report.status,
            customer: {
                id: report.customer_id,
                email: report.pay_from_email
            }
        };

        Logger.info('Processing Platform Order:', { order, transaction });

        const payment = await this.transactionProcessor.process(transaction, user);

        await this.orderManager.addPayment(order, payment);

        if (payment.status !== PaymentStatus.Successful)
            return;

        if (order.status === OrderStatus.Complete)
            return;

        const totalPaid = await this.orderManager.getTotalPaid(order);

        if (totalPaid < order.priceTotal) {
            Logger.info(`Total payments for order ${order.id} of ${totalPaid} ${order.currencyCode} is less than the order amount of ${order.priceTotal} ${order.currencyCode} and will not be completed.`);
            return;
        }

        await this.orderManager.setStatus(order.id, OrderStatus.Paid);
    }
}