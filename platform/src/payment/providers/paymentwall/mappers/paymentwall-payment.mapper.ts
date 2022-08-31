import { Singleton } from '../../../../core/ioc';
import { LogClass } from '../../../../core/logging';
import { NewPayment } from '../../../new-payment';
import { Payment } from '../../../payment';
import { PaymentMethod } from '../../../payment-method';
import { PaymentProvider } from '../../../payment-provider';
import { PaymentStatus } from '../../../payment-status';
import { PaymentType } from '../../../payment-type';
import { PaymentwallPayment } from '../../../../integration/paymentwall';

@Singleton
@LogClass()
export class PaymentwallPaymentMapper {
    public toNewPayment(payment: PaymentwallPayment, paymentMethod: PaymentMethod): NewPayment {
        return {
            userId: paymentMethod.userId,
            provider: PaymentProvider.Paymentwall,
            type: PaymentType.Purchase,
            status: this.mapStatus(payment),
            paymentMethodId: paymentMethod.id,
            amount: payment.amount,
            currencyCode: payment.currency,
            providerRef: payment.id
        };
    }

    public toPayment(id: number, update: PaymentwallPayment, paymentMethod: PaymentMethod): Payment {
        const payment: Partial<Payment> = {
            id,
            provider: PaymentProvider.Paymentwall,
            userId: paymentMethod.userId,
            type: PaymentType.Purchase,
            status: this.mapStatus(update),
            paymentMethodId: paymentMethod.id,
            amount: update.amount,
            currencyCode: update.currency,
            providerRef: update.id
        };

        return payment as Payment;
    }

    private mapStatus(payment: PaymentwallPayment): PaymentStatus {
        if (payment.refunded)
            return PaymentStatus.Refunded;

        return PaymentStatus.Successful;
    }
}