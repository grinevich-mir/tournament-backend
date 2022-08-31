import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { ChargifyClientFactory, ChargifyTransaction, ChargifyTransactionType } from '@tcom/platform/lib/integration/chargify';
import { Subscription, SubscriptionManager } from '@tcom/platform/lib/subscription';
import { PaymentFailureNotificationModel, PaymentSuccessNotificationModel } from '../../models';
import { NotificationProcessor } from '../notification-processor';
import { Payment, PaymentManager, PaymentMethodManager, PaymentProvider, PaymentType } from '@tcom/platform/lib/payment';
import { ChargifyPaymentMapper } from '@tcom/platform/lib/payment/providers/chargify';

const ALLOWED_TYPES = [
    ChargifyTransactionType.Payment,
    ChargifyTransactionType.Refund
];

@Singleton
@LogClass()
export class PaymentNotificationProcessor implements NotificationProcessor<PaymentSuccessNotificationModel | PaymentFailureNotificationModel> {
    constructor(
        @Inject private readonly clientFactory: ChargifyClientFactory,
        @Inject private readonly paymentManager: PaymentManager,
        @Inject private readonly paymentMethodManager: PaymentMethodManager,
        @Inject private readonly subscriptionManager: SubscriptionManager,
        @Inject private readonly mapper: ChargifyPaymentMapper) {
        }

    public async process(skinId: string, notification: PaymentSuccessNotificationModel | PaymentFailureNotificationModel, subscription?: Subscription): Promise<void> {
        if (!notification.payload.transaction) {
            Logger.error(`Chargify payment notification transaction is missing.`);
            return;
        }

        if (!ALLOWED_TYPES.includes(notification.payload.transaction.transaction_type))
            return;

        const client = await this.clientFactory.create(skinId);
        const transaction = await client.transactions.get(notification.payload.transaction.id);

        if (!transaction) {
            Logger.warn(`Chargify transaction ${notification.payload.transaction.id} was not found. Aborting...`);
            return;
        }

        await this.syncPayment(notification, transaction, subscription);
    }

    private async syncPayment(notification: PaymentSuccessNotificationModel | PaymentFailureNotificationModel, transaction: ChargifyTransaction, subscription?: Subscription): Promise<Payment | undefined> {
        const platformPayment = await this.paymentManager.getByProviderRef(PaymentProvider.Chargify, transaction.id.toString());
        const paymentProfileId = notification.payload.subscription.credit_card?.id || notification.payload.subscription.bank_account?.id;
        if (!paymentProfileId)
            throw new Error('Could not get Chargify payment profile ID.');

        const paymentMethod = await this.paymentMethodManager.getByProviderRef(PaymentProvider.Chargify, paymentProfileId.toString());

        if (!paymentMethod)
            throw new Error(`Could not find Chargify payment method with reference ${paymentProfileId}`);

        if (!platformPayment) {
            Logger.info(`Platform subscription payment does not exist with provider ref '${transaction.id}'`);
            const newPayment = this.mapper.toNewPayment(transaction, paymentMethod);

            if (notification.payload.subscription.product.handle === 'purchase')
                newPayment.type = PaymentType.Purchase;

            const payment = await this.paymentManager.add(newPayment);
            if (subscription)
                await this.subscriptionManager.addPayment(subscription.id, payment.id);

            return payment;
        }

        const paymentUpdate = this.mapper.toPayment(platformPayment.id, transaction, paymentMethod);

        if (notification.payload.subscription.product.handle === 'purchase')
            paymentUpdate.type = PaymentType.Purchase;

        return this.paymentManager.update(paymentUpdate);
    }
}