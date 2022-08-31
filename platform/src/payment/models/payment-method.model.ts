import { PaymentMethodCardType } from '../payment-method-card-type';
import { PaymentMethodType } from '../payment-method-type';
import { PaymentProvider } from '../payment-provider';

interface PaymentMethodModelBase {
    id: number;
    type: PaymentMethodType;
    provider: PaymentProvider;
    enabled: boolean;
    createTime: Date;
    updateTime: Date;
}

export interface CreditCardPaymentMethodModel extends PaymentMethodModelBase {
    type: PaymentMethodType.CreditCard;
    cardType: PaymentMethodCardType;
    lastFour: string;
    expiryMonth: number;
    expiryYear: number;
}

export interface BankAccountPaymentMethodModel extends PaymentMethodModelBase {
    type: PaymentMethodType.BankAccount;
    routingNumber: string;
    accountNumber: string;
}

export interface PayPalPaymentMethodModel extends PaymentMethodModelBase {
    type: PaymentMethodType.PayPal;
    email: string;
}

export interface GiropayPaymentMethodModel extends PaymentMethodModelBase {
    type: PaymentMethodType.Giropay;
}

export interface PaysafecardPaymentMethodModel extends PaymentMethodModelBase {
    type: PaymentMethodType.Paysafecard;
}

export interface SkrillPaymentMethodModel extends PaymentMethodModelBase {
    type: PaymentMethodType.Skrill;
    email: string;
}

export interface PaymentwallPaymentMethodModel extends PaymentMethodModelBase {
    type: PaymentMethodType.Paymentwall;
}

export type PaymentMethodModel = CreditCardPaymentMethodModel |
                                  BankAccountPaymentMethodModel |
                                  PayPalPaymentMethodModel |
                                  GiropayPaymentMethodModel |
                                  PaysafecardPaymentMethodModel |
                                  SkrillPaymentMethodModel |
                                  PaymentwallPaymentMethodModel;
