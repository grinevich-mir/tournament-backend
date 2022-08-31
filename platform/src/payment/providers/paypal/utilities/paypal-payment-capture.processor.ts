import { Singleton, Inject } from '../../../../core/ioc';
import { NotFoundError, BadRequestError } from '../../../../core';
import { LogClass } from '../../../../core/logging';
import { PayPalOrderStatus, PayPalClientFactory } from '../../../../integration/paypal';
import { Payment } from '../../../payment';
import { PayPalErrorMapper } from '../mappers';
import { PayPalPaymentMethodSynchroniser } from './paypal-payment-method.synchroniser';
import { PayPalPaymentSynchroniser } from './paypal-payment.synchroniser';

@Singleton
@LogClass()
export class PayPalPaymentCaptureProcessor {
    constructor(
        @Inject private readonly clientFactory: PayPalClientFactory,
        @Inject private readonly paymentMethodSynchroniser: PayPalPaymentMethodSynchroniser,
        @Inject private readonly paymentSynchroniser: PayPalPaymentSynchroniser,
        @Inject private readonly errorMapper: PayPalErrorMapper) {
    }

    public async process(orderId: string, userId: number): Promise<Payment> {
        try {
            const client = await this.clientFactory.create();
            const order = await client.order.capture(orderId);

            if (order.status !== PayPalOrderStatus.Completed)
                throw new BadRequestError('PayPal capture is not complete.');

            const purchaseUnit = order.purchase_units[0];

            if (!purchaseUnit)
                throw new NotFoundError(`PayPal purchase unit for order '${order.id}' not found.`);

            const capturedPayment = purchaseUnit.payments?.captures?.[0];

            if (!capturedPayment)
                throw new NotFoundError(`PayPal payment capture details not found.`);

            const paymentMethod = await this.paymentMethodSynchroniser.run(order.payer, userId);

            return this.paymentSynchroniser.run(capturedPayment, paymentMethod);
        }
        catch (err) {
            throw this.errorMapper.map(err);
        }
    }
}