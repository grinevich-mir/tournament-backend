export interface TrustlyAddress {
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}

export interface TrustlyMerchant {
    merchantId: string;
    name: string;
}

export interface TrustlyPaymentProviderTransaction {
    paymentProviderTransactionId: string;
    status: string;
    statusMessage: string;
}

export enum TrustlyVerificationStatus {
    Automatic = 1,
    ToVerify = 2,
    Verified = 3,
    Refused = 4
}

export enum TrustlyVerificationType {
    NotVerified = 0,
    MicroDeposits = 1,
    OnlineBanking = 2,
    Database = 3
}

export enum TrustlyVerificationMode {
    VerifiedByMerchant = 1,
    ApprovedByMerchant = 2,
    VerifiedByTrustly = 3,
    AmountAuthorizedByMerchant = 4
}

export interface TrustlyVerification {
    status: TrustlyVerificationStatus;
    mode: TrustlyVerificationMode;
    verifyCustomer: boolean;
}

export enum TrustlyAccountType {
    Unknown = -1,
    Other = 0,
    Checking = 1,
    Savings = 2
}

export enum TrustlyAccountProfile {
    Unknown = -1,
    Other = 0,
    Personal = 1,
    Business = 2
}

export interface TrustlyAccountVerification {
    verified: boolean;
    type: TrustlyVerificationType;
    score: number;
    thirdPartyScore: number;
    verificationDate: number;
}

export interface TrustlyAccount {
    nameOnAccount: string;
    name: string;
    type: TrustlyAccountType;
    profile: TrustlyAccountProfile;
    verified: boolean;
    verification: TrustlyAccountVerification;
    source: number;
    accountNumber: string;
    routingNumber: string;
    iban?: string;
    token: string;
}

export enum TrustlyRecurrenceFrequencyUnitType {
    Day = 1,
    Week = 2,
    Month = 3,
    Year = 4
}

export interface TrustlyRecurrence {
    startDate: number;
    endDate: number;
    nextOccurrence: number;
    recurringAmount: string;
    debtSettlement: string;
    frequency: number;
    frequencyUnit: number;
    frequencyUnitType: TrustlyRecurrenceFrequencyUnitType;
    automaticCapture: boolean;
}