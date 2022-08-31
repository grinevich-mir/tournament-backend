import { TrustlyPaymentProviderTransaction, TrustlyVerificationStatus } from './common';
import { TrustlyNewCustomer } from './customer';
import { TrustlyPayment, TrustlyPaymentAuthorization, TrustlyPaymentType } from './payment';

export interface TrustlyEstablishParams {
    merchantId: string;
    merchantReference: string;
    amount: string;
    currency: string;
    description: string;
    returnUrl: string;
    cancelUrl: string;
    paymentType: TrustlyPaymentType.Instant | TrustlyPaymentType.Disbursement | TrustlyPaymentType.Deferred;
    customer: TrustlyNewCustomer;
    requestSignature?: string;
}

export interface TrustlyEstablishResponse {
    establishData: {
        merchantId: string;
        paymentType: TrustlyPaymentType;
        returnUrl: string;
        cancelUrl: string;
        data: string;
        accessId: string;
        requestSignature: string;
    };
    url: string;
}

export enum TrustlyTransactionType {
    External = 0,
    Authorize = 1,
    Pay = 2,
    Capture = 3,
    Refund = 4,
    Reverse = 5,
    Deposit = 6,
    Reclaim = 7,
    Representment = 8,
    Preauthorization = 10
}

export enum TrustlyTransactionStatus {
    New = 0,
    Pending = 1,
    Authorized = 2,
    Processed = 3,
    Complete = 4,
    Failed = 5,
    Expired = 6,
    Canceled = 7,
    Denied = 8,
    Reversed = 10,
    PartiallyRefunded = 11,
    Refunded = 12,
    Voided = 13,
    OnHold = 14
}

export interface TrustlyTransaction {
    transactionId: string;
    transactionType: TrustlyTransactionType;
    originalTransactionId?: string;
    payment: TrustlyPayment;
    currency: string;
    amount: string;
    pending: string;
    paid: string;
    refunded: string;
    reversed: string;
    balance: string;
    paymentProviderTransaction: TrustlyPaymentProviderTransaction;
    status: TrustlyTransactionStatus;
    statusMessage: string;
    ip: string;
    createdAt: number;
    processedAt: number;
    completedAt: number;
    updatedAt: number;
    ppTrxId: string;
    merchantReference: string;
    automaticRepresentment: boolean;
    statusCode: string;
    expiredAt: number;
    recordVersion: number;
}

export interface TrustlyTransactionPreAuthParams {
    merchantReference: string;
    period: number;
    amount?: string;
    splitToken?: string;
}

export interface TrustlyTransactionCaptureParams {
    merchantReference: string;
    amount: string;
    splitToken?: string;
}

export interface TrustlyTransactionListParams {
    transactionType?: TrustlyTransactionType;
    transactionStatus?: TrustlyTransactionStatus;
    originalTransactionId?: string;
    payment?: {
        paymentId?: number;
        merchantReference?: string;
        auth?: {
            status: TrustlyPaymentAuthorization
        },
        verification?: {
            status: TrustlyVerificationStatus;
        }
    };
    count?: number;
    startIndex?: number;
    orderBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
}

export interface TrustlyTransactionListResponse {
    transactions: TrustlyTransaction[];
    startIndex: number;
    itemsPerPage: number;
}