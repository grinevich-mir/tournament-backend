
import { NotFoundError, BadRequestError, ForbiddenError } from '../../../core';
import { Inject, Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { User } from '../../../user';
import { NewPaymentMethod } from '../../new-payment-method';
import { PaymentInitResult } from '../../payment-init-result';
import { PaymentMethod } from '../../payment-method';
import { PaymentMethodInitResult } from '../../payment-method-init-result';
import { PaymentResult } from '../../payment-result';
import { PaymentGateway } from '../payment-gateway';
import { Payment } from '../../payment';
import { PayPalCheckoutPaymentIntent, PayPalClientFactory, PayPalLinkRelationType, PayPalOrderStatus } from '../../../integration/paypal';
import { PayPalPaymentCaptureProcessor } from './utilities';

@Singleton
@LogClass()
export class PayPalPaymentGateway implements PaymentGateway {
    constructor(
        @Inject private readonly clientFactory: PayPalClientFactory,
        @Inject private readonly paymentCaptureProcessor: PayPalPaymentCaptureProcessor) {
    }

    public async createPaymentMethod(user: User, info: NewPaymentMethod): Promise<PaymentMethod> {
        throw new Error('Method not implemented.');
    }

    public async initPaymentMethod(user: User, returnUrl?: string): Promise<PaymentMethodInitResult> {
        throw new Error('Method not implemented.');
    }

    public async refreshPaymentMethod(user: User, paymentMethod: PaymentMethod, data?: any): Promise<PaymentMethodInitResult> {
        throw new Error('Method not implemented.');
    }

    public async getCheckoutUrl(user: User, amount: number, currencyCode: string, description: string, reference: string, returnUrl?: string, cancelUrl?: string): Promise<string> {
        const client = await this.clientFactory.create();
        const response = await client.order.create({
            intent: PayPalCheckoutPaymentIntent.Capture,
            purchase_units: [
                {
                    reference_id: reference,
                    amount: {
                        currency_code: currencyCode,
                        value: amount.toFixed(2)
                    },
                    description
                }
            ],
            application_context: {
                return_url: returnUrl || '',
                cancel_url: cancelUrl || returnUrl || ''
            }
        });

        const approveLink = response.links.find(l => l.rel === PayPalLinkRelationType.Approve);

        if (!approveLink)
            throw new NotFoundError('PayPal approval link not found.');

        return approveLink.href;
    }

    public async initPayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, description: string, reference: string): Promise<PaymentInitResult> {
        throw new Error('Method not implemented.');
    }

    public async takePayment(user: User, paymentMethod: PaymentMethod, amount: number, currencyCode: string, reference: string, description?: string, redirectUrl?: string): Promise<PaymentResult> {
        throw new Error('Method not implemented.');
    }

    public async completePayment(user: User, reference: string, data: Record<string, string>): Promise<Payment> {
        const orderId = data.token;

        if (!orderId)
            throw new BadRequestError('PayPal order ID not supplied.');

        const client = await this.clientFactory.create();
        const order = await client.order.get(orderId);

        if (!order)
            throw new NotFoundError(`PayPal order '${orderId}' not found.`);

        const purchaseUnit = order.purchase_units[0];

        if (!purchaseUnit)
            throw new NotFoundError(`PayPal purchase unit for order '${order.id}' not found.`);

        if (purchaseUnit.reference_id !== reference)
            throw new BadRequestError('PayPal reference ID does not match platform order ID.');

        if (order.status !== PayPalOrderStatus.Approved)
            throw new ForbiddenError('PayPal order must be approved by user before completion.');

        return this.paymentCaptureProcessor.process(order.id, user.id);
    }
}