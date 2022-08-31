import { Singleton } from '../../../../core/ioc';
import { LogClass } from '../../../../core/logging';
import { NewPayment } from '../../../new-payment';
import { Payment } from '../../../payment';
import { PaymentMethod } from '../../../payment-method';
import { PaymentProvider } from '../../../payment-provider';
import { PaymentStatus } from '../../../payment-status';
import { PaymentType } from '../../../payment-type';
import { PayPalPaymentCapture, PayPalPaymentStatus } from '../../../../integration/paypal';
import moment from 'moment';

@Singleton
@LogClass()
export class PayPalPaymentMapper {
    public toNewPayment(capture: PayPalPaymentCapture, paymentMethod: PaymentMethod): NewPayment {
        return {
            userId: paymentMethod.userId,
            provider: PaymentProvider.PayPal,
            type: PaymentType.Purchase,
            status: this.mapStatus(capture.status),
            amount: Number(capture.amount.value),
            currencyCode: capture.amount.currency_code,
            providerRef: capture.id,
            paymentMethodId: paymentMethod.id,
            createTime: moment(capture.create_time).toDate()
        };
    }

    public toPayment(id: number, capture: PayPalPaymentCapture, paymentMethod: PaymentMethod): Payment {
        const payment: Partial<Payment> = {
            id,
            provider: PaymentProvider.PayPal,
            userId: paymentMethod.userId,
            type: PaymentType.Purchase,
            status: this.mapStatus(capture.status),
            amount: Number(capture.amount.value),
            currencyCode: capture.amount.currency_code,
            providerRef: capture.id,
            paymentMethodId: paymentMethod.id,
            createTime: moment(capture.create_time).toDate()
        };

        return payment as Payment;
    }

    private mapStatus(status: PayPalPaymentStatus): PaymentStatus {
        switch (status) {
            default:
                return PaymentStatus.Pending;

            case PayPalPaymentStatus.Failed:
            case PayPalPaymentStatus.Declined:
                return PaymentStatus.Declined;

            case PayPalPaymentStatus.PartiallyRefunded:
            case PayPalPaymentStatus.Refunded:
                return PaymentStatus.Refunded;

            case PayPalPaymentStatus.Completed:
                return PaymentStatus.Successful;
        }
    }
}