import _ from 'lodash';
import moment from 'moment';
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { TrustlyTransaction, TrustlyTransactionStatus } from '../../../integration/trustly';
import { NewPayment } from '../../new-payment';
import { Payment } from '../../payment';
import { PaymentErrorCode } from '../../payment-error-code';
import { PaymentMethod } from '../../payment-method';
import { PaymentProvider } from '../../payment-provider';
import { PaymentStatus } from '../../payment-status';
import { PaymentType } from '../../payment-type';


interface ErrorCodeMap {
    [status: number]: {
        [code: string]: {
            [statusCode: string]: PaymentErrorCode
        };
    };
}

const ERROR_CODE_MAP: ErrorCodeMap = {
    [TrustlyTransactionStatus.Failed]: {
        326: {
            SW057: PaymentErrorCode.PaymentMethodExpired
        },
        380: {
            SW051: PaymentErrorCode.PaymentMethodExpired
        },
        330: {
            SW056: PaymentErrorCode.PaymentMethodInvalid
        },
        390: {
            SW054: PaymentErrorCode.PaymentMethodInvalid,
            SW055: PaymentErrorCode.PaymentMethodInvalid
        },
        378: {
            SW052: PaymentErrorCode.NetworkError
        }
    },
    [TrustlyTransactionStatus.Denied]: {
        331: {
            SW021: PaymentErrorCode.InsufficientFunds
        }
    }
};

@Singleton
@LogClass()
export class TrustlyPaymentMapper {
    public toNewPayment(transaction: TrustlyTransaction, paymentMethod: PaymentMethod, errorCode?: string): NewPayment {
        return {
            userId: paymentMethod.userId,
            provider: PaymentProvider.Trustly,
            type: PaymentType.Purchase,
            status: this.mapStatus(transaction),
            amount: Number(transaction.amount),
            currencyCode: transaction.currency,
            providerRef: transaction.transactionId,
            paymentMethodId: paymentMethod.id,
            errorCode: this.mapErrorCode(transaction, errorCode),
            createTime: moment(transaction.createdAt).toDate()
        };
    }

    public toPayment(id: number, transaction: TrustlyTransaction, paymentMethod: PaymentMethod, errorCode?: string): Payment {
        const payment: Partial<Payment> = {
            id,
            provider: PaymentProvider.Trustly,
            userId: paymentMethod.userId,
            type: PaymentType.Purchase,
            status: this.mapStatus(transaction),
            amount: Number(transaction.amount),
            currencyCode: transaction.currency,
            providerRef: transaction.transactionId,
            paymentMethodId: paymentMethod.id,
            errorCode: this.mapErrorCode(transaction, errorCode),
            createTime: moment(transaction.createdAt).toDate()
        };

        return payment as Payment;
    }

    private mapStatus(transaction: TrustlyTransaction): PaymentStatus {
        switch (transaction.status) {
            default:
                return PaymentStatus.Pending;

            case TrustlyTransactionStatus.Failed:
            case TrustlyTransactionStatus.Denied:
                return PaymentStatus.Declined;

            case TrustlyTransactionStatus.Refunded:
            case TrustlyTransactionStatus.Reversed:
            case TrustlyTransactionStatus.Voided:
                return PaymentStatus.Refunded;

            case TrustlyTransactionStatus.Complete:
                return PaymentStatus.Successful;
        }
    }

    private mapErrorCode(transaction: TrustlyTransaction, errorCode?: string): PaymentErrorCode | undefined {
        if (!errorCode)
            return undefined;

        const statusMap = ERROR_CODE_MAP[transaction.status];

        if (!statusMap)
            return undefined;

        const codeMap = statusMap[errorCode];

        if (!codeMap)
            return undefined;

        return codeMap[transaction.statusCode];
    }
}