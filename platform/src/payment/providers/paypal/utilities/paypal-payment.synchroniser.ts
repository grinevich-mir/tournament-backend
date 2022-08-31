import { Singleton, Inject } from '../../../../core/ioc';
import Logger, { LogClass } from '../../../../core/logging';
import { PayPalPaymentCapture } from '../../../../integration/paypal';
import { Payment } from '../../../payment';
import { PaymentManager } from '../../../payment-manager';
import { PaymentMethod } from '../../../payment-method';
import { PaymentProvider } from '../../../payment-provider';
import { PayPalPaymentMapper } from '../mappers';

@Singleton
@LogClass()
export class PayPalPaymentSynchroniser {
    constructor(
        @Inject private readonly paymentManager: PaymentManager,
        @Inject private readonly paymentMapper: PayPalPaymentMapper) {
    }

    public async run(capture: PayPalPaymentCapture, paymentMethod: PaymentMethod): Promise<Payment> {
        const payment = await this.paymentManager.getByProviderRef(PaymentProvider.PayPal, capture.id);

        return payment
            ? this.update(payment, capture, paymentMethod)
            : this.add(capture, paymentMethod);
    }

    private async add(capture: PayPalPaymentCapture, paymentMethod: PaymentMethod): Promise<Payment> {
        Logger.info(`Creating new payment for provider ref '${capture.id}' w/ status '${capture.status}'`);

        const added = this.paymentMapper.toNewPayment(capture, paymentMethod);

        return this.paymentManager.add(added);
    }

    private async update(payment: Payment, capture: PayPalPaymentCapture, paymentMethod: PaymentMethod): Promise<Payment> {
        Logger.info(`Updating payment '${payment.id}' for provider ref '${capture.id}' w/ status '${capture.status}'`);

        const updated = this.paymentMapper.toPayment(payment.id, capture, paymentMethod);

        return this.paymentManager.update(updated);
    }
}