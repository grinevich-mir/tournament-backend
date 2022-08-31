import { PaymentMethodCardType } from './payment-method-card-type';
import { PaymentMethodMetadata } from './payment-method-metadata';
import { PaymentMethodType } from './payment-method-type';
import { PaymentProvider } from './payment-provider';

interface PaymentMethodBase {
    id: number;
    type: PaymentMethodType;
    userId: number;
    provider: PaymentProvider;
    providerRef: string;
    metadata?: PaymentMethodMetadata;
    enabled: boolean;
    createTime: Date;
    updateTime: Date;
}

export interface CreditCardPaymentMethod extends PaymentMethodBase {
    type: PaymentMethodType.CreditCard;
    cardType: PaymentMethodCardType;
    lastFour: string;
    expiryMonth: number;
    expiryYear: number;
}

export interface BankAccountPaymentMethod extends PaymentMethodBase {
    type: PaymentMethodType.BankAccount;
    name?: string;
    bankName?: string;
    bankId?: string;
    routingNumber: string;
    accountNumber: string;
}

export interface PayPalPaymentMethod extends PaymentMethodBase {
    type: PaymentMethodType.PayPal;
    email: string;
}

export interface GiropayPaymentMethod extends PaymentMethodBase {
    type: PaymentMethodType.Giropay;
}

export interface PaysafecardPaymentMethod extends PaymentMethodBase {
    type: PaymentMethodType.Paysafecard;
}

export interface SkrillPaymentMethod extends PaymentMethodBase {
    type: PaymentMethodType.Skrill;
    email: string;
}

export interface PaymentwallPaymentMethod extends PaymentMethodBase {
    type: PaymentMethodType.Paymentwall;
}

export type PaymentMethod = CreditCardPaymentMethod |
                             BankAccountPaymentMethod |
                             PayPalPaymentMethod |
                             GiropayPaymentMethod |
                             PaysafecardPaymentMethod |
                             SkrillPaymentMethod |
                             PaymentwallPaymentMethod;