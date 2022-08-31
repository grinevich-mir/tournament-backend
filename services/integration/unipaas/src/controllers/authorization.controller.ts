import { APIGatewayEvent, ProxyResult } from 'aws-lambda';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { Config, ParameterStore } from '@tcom/platform/lib/core';
import crypto from 'crypto';
import { AuthorizationModel } from '../models';
import { UnipaasAuthorization, UnipaasAuthorizationStatus, UnipaasClientFactory } from '@tcom/platform/lib/integration/unipaas';
import { IdempotencyCache } from '@tcom/platform/lib/api';
import { Order, OrderManager, OrderStatus } from '@tcom/platform/lib/order';
import { Payment, PaymentManager, PaymentMethodManager, PaymentProvider, PaymentStatus } from '@tcom/platform/lib/payment';
import { UnipaasPaymentMapper, UnipaasPaymentMethodMapper } from '@tcom/platform/lib/payment/providers/unipaas';

const ALLOWED_STATUSES = [
    UnipaasAuthorizationStatus.Captured,
    UnipaasAuthorizationStatus.Error,
    UnipaasAuthorizationStatus.Declined,
    UnipaasAuthorizationStatus.Voided,
    UnipaasAuthorizationStatus.Refunded
];

@Singleton
@LogClass()
export class AuthorizationController {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly clientFactory: UnipaasClientFactory,
        @Inject private readonly paymentMethodManager: PaymentMethodManager,
        @Inject private readonly paymentManager: PaymentManager,
        @Inject private readonly paymentMapper: UnipaasPaymentMapper,
        @Inject private readonly paymentMethodMapper: UnipaasPaymentMethodMapper,
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly idempotency: IdempotencyCache) {
    }

    public async process(event: APIGatewayEvent): Promise<ProxyResult> {
        try {
            const body = await this.verify<AuthorizationModel>(event);

            await this.idempotency.get(body.transactionId, async () => {
                const client = await this.clientFactory.create();
                const authorization = await client.payIn.get(body.authorizationId);

                if (!authorization)
                    throw new Error(`Unipaas Authorization ${body.authorizationId} could not be found.`);

                Logger.info('Authorization', authorization);

                if (!ALLOWED_STATUSES.includes(authorization.authorizationStatus)) {
                    Logger.info(`Ignoring authorization with status of ${authorization.authorizationStatus}`);
                    return;
                }

                await this.processAuthorization(authorization);
            });

            return this.ok();
        } catch (err) {
            Logger.error(err);
            return this.ok();
        }
    }

    private ok(): ProxyResult {
        return {
            body: 'Ok',
            statusCode: 200
        };
    }

    private async verify<T>(event: APIGatewayEvent): Promise<T> {
        if (!event.body)
            throw new Error('Body cannot be empty.');

        const requestSignature = event.headers['X-Hmac-SHA256'];

        if (!requestSignature)
            throw new Error('Signature header missing.');

        const apiKey = await this.parameterStore.get(`/${Config.stage}/integration/unipaas/api-key`, true, true);

        const hash = crypto.createHmac('sha256', apiKey)
            .update(event.body)
            .digest('hex');

        const expectedSignature = Buffer.from(hash).toString('base64');

        if (expectedSignature !== requestSignature) {
            Logger.warn('Invalid Unipaas webhook signature.', {
                requestSignature,
                expectedSignature
            });
            throw new Error('Invalid signature.');
        }

        return JSON.parse(event.body) as T;
    }

    private async processAuthorization(authorization: UnipaasAuthorization): Promise<void> {
        const orderId = Number(authorization.orderId);

        if (isNaN(orderId))
            return;

        const order = await this.orderManager.get(orderId);

        if (!order)
            throw new Error(`Order ${orderId} not found.`);

        const payment = await this.syncPayment(authorization, order);

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

    private async syncPayment(authorization: UnipaasAuthorization, order: Order): Promise<Payment> {
        const platformPayment = await this.paymentManager.getByProviderRef(PaymentProvider.Unipaas, authorization.authorizationId);
        const paymentOptionId = authorization.paymentOption.paymentOptionId;

        if (!paymentOptionId)
            throw new Error('Could not get Unipaas payment option ID.');

        let paymentMethod = await this.paymentMethodManager.getByProviderRef(PaymentProvider.Unipaas, paymentOptionId.toString());

        if (!paymentMethod) {
            Logger.info(`Platform payment method does not exist with provider ref ${paymentOptionId}`);
            const newPaymenteMethod = this.paymentMethodMapper.map(authorization);
            newPaymenteMethod.userId = order.userId;
            newPaymenteMethod.enabled = true;
            paymentMethod = await this.paymentMethodManager.add(newPaymenteMethod);
        }

        if (!platformPayment) {
            Logger.info(`Platform payment does not exist with provider ref '${authorization.authorizationId}'`);
            const newPayment = this.paymentMapper.toNewPayment(authorization, paymentMethod);
            return this.paymentManager.add(newPayment);
        }

        const paymentUpdate = this.paymentMapper.toPayment(platformPayment.id, authorization, paymentMethod);
        return this.paymentManager.update(paymentUpdate);
    }
}
