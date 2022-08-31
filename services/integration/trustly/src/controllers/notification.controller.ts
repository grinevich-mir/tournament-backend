import { APIGatewayEvent, ProxyResult } from 'aws-lambda';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { TrustlyClientFactory, TrustlyTransaction } from '@tcom/platform/lib/integration/trustly';
import { IdempotencyCache } from '@tcom/platform/lib/api';
import { Order, OrderManager, OrderStatus } from '@tcom/platform/lib/order';
import qs from 'qs';
import { Payment, PaymentManager, PaymentMethod, PaymentMethodManager, PaymentProvider, PaymentStatus } from '@tcom/platform/lib/payment';
import { TrustlyPaymentMapper, TrustlyPaymentMethodMapper } from '@tcom/platform/lib/payment/providers/trustly';
import { NotFoundError, UnauthorizedError } from '@tcom/platform/lib/core';
import { TrustlyRequestSigner } from '@tcom/platform/lib/integration/trustly/utilities';

interface TrustlyNotification {
    merchantId: string;
    merchantReference: string;
    paymentType: string;
    transactionType: string;
    eventId: string;
    eventType: string;
    objectId: string;
    objectType: string;
    message: string;
    timeZone: string;
    createdAt: string;
    fiName?: string;
    fiCode?: string;
    status: string;
    statusMessage: string;
    splitToken?: string;
    errorCode?: string;
    'paymentProviderTransaction.status'?: string;
    'paymentProviderTransaction.statusMessage'?: string;
}

const ALLOWED_OBJECT_TYPES = [
    'Transaction'
];

const ALLOWED_EVENT_TYPES = [
    'Authorize',
    'Complete',
    'Refund',
    'Fail',
    'Deny'
];

const INVALID_PAYMENT_METHOD_ERROR_MAP: { [code: string]: string[] } = {
    330: ['SW056'],
    390: ['SW054', 'SW055']
};

@Singleton
@LogClass()
export class NotificationController {
    constructor(
        @Inject private readonly clientFactory: TrustlyClientFactory,
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly paymentManager: PaymentManager,
        @Inject private readonly paymentMapper: TrustlyPaymentMapper,
        @Inject private readonly paymentMethodManager: PaymentMethodManager,
        @Inject private readonly paymentMethodMapper: TrustlyPaymentMethodMapper,
        @Inject private readonly idempotency: IdempotencyCache,
        @Inject private readonly requestSigner: TrustlyRequestSigner) {
    }

    public async process(event: APIGatewayEvent): Promise<ProxyResult> {
        const notification = await this.verify(event);
        Logger.info('Notification', notification);

        await this.idempotency.get(notification.eventId, async () => {
            if (!ALLOWED_OBJECT_TYPES.includes(notification.objectType))
                return;

            if (!ALLOWED_EVENT_TYPES.includes(notification.eventType))
                return;

            const client = await this.clientFactory.create();
            const transaction = await client.transaction.get(notification.objectId);
            const customer = await client.customer.get(transaction.payment.customer.customerId);

            if (!customer)
                throw new NotFoundError('Customer not found.');

            Logger.info('Transaction', transaction);
            Logger.info('Customer', customer);

            const userId = Number(customer.externalId);
            const paymentMethod = await this.syncPaymentMethod(transaction, userId, notification.splitToken);

            if (paymentMethod.enabled && this.isInvalidPaymentMethod(notification))
                await this.paymentMethodManager.disable(paymentMethod);

            if (notification.eventType === 'Authorize')
                return;

            const orderId = Number(transaction.merchantReference);

            if (isNaN(orderId))
                return;

            const order = await this.orderManager.get(orderId);

            if (!order)
                throw new Error(`Order ${orderId} not found.`);

            await this.processTransaction(transaction, order, paymentMethod, notification);
        });

        return this.ok();
    }

    private ok(): ProxyResult {
        return {
            body: 'Ok',
            statusCode: 200
        };
    }

    private async verify(event: APIGatewayEvent): Promise<TrustlyNotification> {
        if (!event.body)
            throw new Error('Body cannot be empty.');

        const notification = qs.parse(event.body) as unknown as TrustlyNotification;

        const header = event.headers.Authorization;

        if (!header)
            throw new Error('Authorization header is missing.');


        if (notification.fiName)
            notification.fiName = notification.fiName.replace('+', ' ');

        const body = decodeURIComponent(qs.stringify(notification, { encode: false }));
        const headerParts = header.split(' ');
        const signatureData = Buffer.from(headerParts[1], 'base64').toString('utf8');
        const signature = signatureData.split(':')[1];

        const expectedSignature = await this.requestSigner.sign(body);

        if (signature === expectedSignature)
            return notification;

        Logger.error(`Expected signature ${expectedSignature} but got ${signature}`);
        throw new UnauthorizedError('Invalid Request Signature');
    }

    private async processTransaction(transaction: TrustlyTransaction, order: Order, paymentMethod: PaymentMethod, notification: TrustlyNotification): Promise<void> {
        const payment = await this.syncPayment(transaction, paymentMethod, notification);

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

    private async syncPaymentMethod(transaction: TrustlyTransaction, userId: number, splitToken?: string): Promise<PaymentMethod> {
        const paymentMethodRef = transaction.originalTransactionId || transaction.transactionId;

        if (!paymentMethodRef)
            throw new Error('Could not get Trustly payment method reference.');

        let paymentMethod = await this.paymentMethodManager.getByProviderRef(PaymentProvider.Trustly, paymentMethodRef);

        if (!paymentMethod) {
            Logger.info(`Platform payment method does not exist with provider ref ${paymentMethodRef}`);
            const enabled = splitToken && transaction.amount === '0.00' ? true : false;
            const newPaymenteMethod = this.paymentMethodMapper.map(transaction, enabled ? splitToken : undefined);
            newPaymenteMethod.userId = userId;
            newPaymenteMethod.enabled = enabled;
            paymentMethod = await this.paymentMethodManager.add(newPaymenteMethod);
        }

        return paymentMethod;
    }

    private async syncPayment(transaction: TrustlyTransaction, paymentMethod: PaymentMethod, notification: TrustlyNotification): Promise<Payment> {
        const platformPayment = await this.paymentManager.getByProviderRef(PaymentProvider.Trustly, transaction.transactionId);

        if (!platformPayment) {
            Logger.info(`Platform payment does not exist with provider ref '${transaction.transactionId}'`);
            const newPayment = this.paymentMapper.toNewPayment(transaction, paymentMethod, notification.errorCode);
            return this.paymentManager.add(newPayment);
        }

        const paymentUpdate = this.paymentMapper.toPayment(platformPayment.id, transaction, paymentMethod, notification.errorCode);
        return this.paymentManager.update(paymentUpdate);
    }

    private isInvalidPaymentMethod(notification: TrustlyNotification): boolean {
        if (!notification.errorCode)
            return false;

        if (!notification['paymentProviderTransaction.status'])
            return false;

        const providerStatuses = INVALID_PAYMENT_METHOD_ERROR_MAP[notification.errorCode];

        if (!providerStatuses || providerStatuses.length > 0)
            return false;

        return providerStatuses.includes(notification['paymentProviderTransaction.status']);
    }
}
