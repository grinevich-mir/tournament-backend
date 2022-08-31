import { TrustlyAccount, TrustlyAddress, TrustlyMerchant, TrustlyRecurrence, TrustlyVerification } from './common';
import { TrustlyCustomer } from './customer';
import { TrustlyPaymentProvider } from './payment-provider';
import { TrustlyTransactionStatus } from './transaction';

export enum TrustlyPaymentType {
    Instant = 1,
    Deferred = 2,
    Recurring = 3,
    Disbursement = 4,
    Verification = 5,
    Retrieval = 6
}

export enum TrustlyPaymentAuthorizationStatus {
    Pending = 1,
    Authorized = 2,
    Finished = 3,
    Expired = 4,
    Failed = 5,
    Canceled = 6,
    Voided = 7
}

export interface TrustlyPaymentAuthorization {
    token: string;
    status: TrustlyPaymentAuthorizationStatus;
    message: string;
}

export interface TrustlyPayment {
    paymentId: string;
    paymentType: TrustlyPaymentType;
    merchant: TrustlyMerchant;
    merchantReference: string;
    merchantId: string;
    fingerprint:  string;
    verification: TrustlyVerification;
    account: TrustlyAccount;
    description: string;
    returnUrl: string;
    cancelUrl: string;
    currency: string;
    amount: string;
    paymentProvider: TrustlyPaymentProvider;
    allowPaymentProviderType: number[];
    auth: TrustlyPaymentAuthorization;
    authorization: string;
    authorizationStatus: TrustlyTransactionStatus;
    authorizationStatusMessage: string;
    pending: string;
    paid: string;
    refunded: string;
    reversed: string;
    balance: string;
    createdAt: number;
    updatedAt: number;
    recordVersion: number;
    paymentFlow: number;
    customer: TrustlyCustomer;
    address: TrustlyAddress;
    recurrence: TrustlyRecurrence;
}
