import { PagedFilter } from '../core';
import { PaymentMethodType } from '../payment';

export enum UserPaymentTransactionType {
    Subscription = 'Subscription',
    Purchase = 'Purchase',
    Refund = 'Refund',
    Withdrawal = 'Withdrawal'
}

export enum UserPaymentTransactionDirection {
    Credit = 'Credit',
    Debit = 'Debit'
}

export enum UserPaymentTransactionStatus {
    Successful = 'Successful',
    Declined = 'Declined',
    Voided = 'Voided',
    Refunded = 'Refunded',
    Pending = 'Pending',
    Processing = 'Procecssing',
    Complete = 'Complete',
    Cancelled = 'Cancelled'
}

export enum UserPaymentProvider {
    Chargify = 'Chargify',
    Unipaas = 'Unipaas',
    Trustly = 'Trustly',
    PayPal = 'PayPal'
}

export interface UserPaymentTransaction {
    id: string;
    userId: number;
    forename: string;
    surname: string;
    displayName: string;
    email: string;
    type: UserPaymentTransactionType;
    direction: UserPaymentTransactionDirection;
    amount: number;
    currencyCode: string;
    status: UserPaymentTransactionStatus;
    paymentMethodId?: number;
    paymentMethodType: PaymentMethodType;
    paymentMethodDesc: string;
    provider: UserPaymentProvider;
    providerRef: string;
    createTime: Date;
    updateDate: Date;
}

export interface UserPaymentStatisticsFilter extends PagedFilter<UserPaymentTransaction> {
    createdFrom: string;
    createdTo: string;
    userId?: number;
    displayName?: string;
    email?: string;
    types?: UserPaymentTransactionType[];
    paymentMethodTypes?: PaymentMethodType[];
    providers?: UserPaymentProvider[];
    statuses?: UserPaymentTransactionStatus[];
    providerRef?: string;
}