import _ from 'lodash';
import moment from 'moment';
import { centsToMoney } from '../../../banking/utilities';
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { ChargifyTransaction, ChargifyTransactionType } from '../../../integration/chargify';
import { NewPayment } from '../../new-payment';
import { Payment } from '../../payment';
import { PaymentMethod } from '../../payment-method';
import { PaymentProvider } from '../../payment-provider';
import { PaymentStatus } from '../../payment-status';
import { PaymentType } from '../../payment-type';

@Singleton
@LogClass()
export class ChargifyPaymentMapper {
    public toNewPayment(transaction: ChargifyTransaction, paymentMethod: PaymentMethod): NewPayment {
        return {
            userId: paymentMethod.userId,
            provider: PaymentProvider.Chargify,
            type: this.mapType(transaction),
            status: this.mapStatus(transaction),
            amount: centsToMoney(transaction.refunded_amount_in_cents || transaction.amount_in_cents, transaction.currency).toUnit(),
            currencyCode: transaction.currency,
            providerRef: transaction.id.toString(),
            paymentMethodId: paymentMethod.id,
            createTime: moment(transaction.created_at).toDate()
        };
    }

    public toPayment(id: number, transaction: ChargifyTransaction, paymentMethod: PaymentMethod): Payment {
        const payment: Partial<Payment> = {
            id,
            provider: PaymentProvider.Chargify,
            userId: paymentMethod.userId,
            type: this.mapType(transaction),
            status: this.mapStatus(transaction),
            amount: centsToMoney(transaction.amount_in_cents, transaction.currency).toUnit(),
            currencyCode: transaction.currency,
            providerRef: transaction.id.toString(),
            paymentMethodId: paymentMethod.id,
            createTime: moment(transaction.created_at).toDate()
        };

        return payment as Payment;
    }

    private mapType(transaction: ChargifyTransaction): PaymentType {
        switch(transaction.transaction_type) {
            case ChargifyTransactionType.Payment:
                return PaymentType.Subscription;

            case ChargifyTransactionType.Refund:
                return PaymentType.Refund;
        }

        throw new Error(`Could not map Chargify transaction type '${transaction.transaction_type}' to subcription payment type.`);
    }

    private mapStatus(transaction: ChargifyTransaction): PaymentStatus {
        if (transaction.success)
            return PaymentStatus.Successful;

        return PaymentStatus.Declined;
    }
}