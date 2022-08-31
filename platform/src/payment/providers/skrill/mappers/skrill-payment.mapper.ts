import { Singleton } from '../../../../core/ioc';
import { LogClass } from '../../../../core/logging';
import { NewPayment } from '../../../new-payment';
import { Payment } from '../../../payment';
import { PaymentMethod } from '../../../payment-method';
import { PaymentProvider } from '../../../payment-provider';
import { PaymentStatus } from '../../../payment-status';
import { PaymentType } from '../../../payment-type';
import { SkrillTransactionStatus, SkrillTransaction } from '../../../../integration/skrill';

@Singleton
@LogClass()
export class SkrillPaymentMapper {
    public toNewPayment(transaction: SkrillTransaction, paymentMethod: PaymentMethod): NewPayment {
        return {
            userId: paymentMethod.userId,
            provider: PaymentProvider.Skrill,
            type: PaymentType.Purchase,
            status: this.mapStatus(transaction.status),
            paymentMethodId: paymentMethod.id,
            amount: transaction.amount,
            currencyCode: transaction.currencyCode,
            providerRef: transaction.id
        };
    }

    public toPayment(id: number, transaction: SkrillTransaction, paymentMethod: PaymentMethod): Payment {
        const payment: Partial<Payment> = {
            id,
            provider: PaymentProvider.Skrill,
            userId: paymentMethod.userId,
            type: PaymentType.Purchase,
            status: this.mapStatus(transaction.status),
            paymentMethodId: paymentMethod.id,
            amount: transaction.amount,
            currencyCode: transaction.currencyCode,
            providerRef: transaction.id
        };

        return payment as Payment;
    }

    private mapStatus(status: SkrillTransactionStatus): PaymentStatus {
        switch (status) {
            default:
                return PaymentStatus.Pending;

            case SkrillTransactionStatus.Failed:
                return PaymentStatus.Declined;

            case SkrillTransactionStatus.Chargeback:
                return PaymentStatus.Refunded;

            case SkrillTransactionStatus.Cancelled:
                return PaymentStatus.Voided;

            case SkrillTransactionStatus.Processed:
                return PaymentStatus.Successful;
        }
    }
}