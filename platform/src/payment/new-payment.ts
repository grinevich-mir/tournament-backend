import { PaymentErrorCode } from './payment-error-code';
import { PaymentProvider } from './payment-provider';
import { PaymentStatus } from './payment-status';
import { PaymentType } from './payment-type';

export interface NewPayment {
    type: PaymentType;
    userId: number;
    paymentMethodId: number;
    amount: number;
    memo?: string;
    currencyCode: string;
    provider: PaymentProvider;
    providerRef: string;
    status: PaymentStatus;
    errorCode?: PaymentErrorCode;
    voidTime?: Date;
    createTime?: Date;
}