export interface UnipaasCheckoutShopper {
    email: string;
}

export interface UnipaasAddress {
    firstName?: string;
    lastName?: string;
    city?: string;
    country?: string;
    line1?: string;
    line2?: string;
    postalCode?: string;
    state?: string;
}

export interface UnipaasCheckoutItem {
    name: string;
    amount: number;
    vendorId?: string;
    platformFee?: number;
}

export interface UnipaasCheckoutParams {
    consumerId?: string;
    amount: number;
    currency: string;
    country: string;
    email: string;
    orderId: string;
    reference: string;
    description: string;
    items?: UnipaasCheckoutItem[];
    successfulPaymentRedirect?: string;
    billingAddress?: UnipaasAddress;
    shippingSameAsBilling?: boolean;
    shippingAddress?: UnipaasAddress;
}

export interface UnipaasCheckoutResponse {
    amount: number;
    currency: string;
    country: string;
    orderId: string;
    description?: string;
    items?: UnipaasCheckoutItem[];
    _id: string;
    status: string;
    sessionToken: string;
    shopper: UnipaasCheckoutShopper;
    shortLink: string;
    createdAt: string;
    updatedAt: string;
}

export enum NewUnipaasPaymentOptionType {
    Card = 'Card',
    Alternative = 'Alternative',
    BankAccount = 'Bank Account'
}

interface NewUnipaasPaymentOptionBase {
    paymentOptionId: string;
    type: NewUnipaasPaymentOptionType;
}

export interface NewUnipaasCardPaymentOption extends NewUnipaasPaymentOptionBase {
    type: NewUnipaasPaymentOptionType.Card;
    cardAccount: {
        nameOnCard: string;
        expirationYear: string;
        expirationMonth: string;
        number: string;
        securityCode: string;
    };
}

export interface NewUnipaasBankAccountPaymentOption extends NewUnipaasPaymentOptionBase {
    type: NewUnipaasPaymentOptionType.BankAccount;
    bankAccount: {
        accountNumber: number;
    };
}

export type NewUnipaasPaymentOption = NewUnipaasCardPaymentOption | NewUnipaasBankAccountPaymentOption;

export enum UnipaasPaymentOptionType {
    Card = 'card',
    Alternative = 'alternative',
    BankAccount = 'bank'
}

interface UnipaasPaymentOptionBase {
    paymentOptionId: string;
    paymentOptionType: UnipaasPaymentOptionType;
}

export interface UnipaasCardPaymentOption extends UnipaasPaymentOptionBase {
    paymentOptionType: UnipaasPaymentOptionType.Card;
    nameOnCard: string;
    expirationYear: string;
    expirationMonth: string;
    bin: string;
    brand: string;
    last4digits: string;
    issuerCountry: string;
}

export interface UnipaasBankAccountPaymentOption extends UnipaasPaymentOptionBase {
    paymentOptionType: UnipaasPaymentOptionType.BankAccount;
    accountNumber: string;
}

export interface UnipaasAlternativePaymentOption extends UnipaasPaymentOptionBase {
    paymentOptionType: UnipaasPaymentOptionType.Alternative;
}

export type UnipaasPaymentOption = UnipaasCardPaymentOption | UnipaasBankAccountPaymentOption | UnipaasAlternativePaymentOption;

export enum UnipaasAuthorizationStatus {
    Authorized = 'Authorized',
    Captured = 'Captured',
    Voided = 'Voided',
    Refunded = 'Refunded',
    PartiallyRefunded = 'Partially Refunded',
    PartiallyCaptured = 'Partially Captured',
    PartiallyVoided = 'Partially Voided',
    Declined = 'Declined',
    Pending = 'Pending',
    Error = 'Error'
}

export interface UnipaasConsumer {
    consumerId: string;
    phone: string;
    firstName: string;
    lastName: string;
    email: string;
    shippingAddress: {
        line1: string;
        line2: string;
        city: string;
        country: string;
        postalCode: string;
    };
}

export interface UnipaasAuthorization {
    authorizationId: string;
    authorizationStatus: UnipaasAuthorizationStatus;
    merchantId: string;
    deviceDetails: {
        id: string;
        ipAddress: string;
        deviceType?: string;
        deviceOs?: string;
        browser?: string;
        acceptHeader?: string;
        colorDepth?: string;
        javaEnabled?: 'Y' | 'N';
        javaScriptEnabled?: 'Y' | 'N';
        browserLanguage?: string;
        screenHeight?: string;
        screenWidth?: string;
        timeZone?: string;
        userAgent?: string;
    };
    authentication: {
        isLiabilityShift: string;
        threeDVersion: string;
    };
    currency: string;
    consumer: UnipaasConsumer;
    items: UnipaasCheckoutItem[];
    threeDversion?: string;
    orderId: string;
    paymentOption: UnipaasPaymentOption;
    amount: number;
    transactions: UnipaasTransaction[];
    redirectUrl?: string;
    created_at: string;
    updated_at: string;
}

export enum UnipaasTransactionType {
    Auth = 'Auth',
    Sale = 'Sale'
}

export interface UnipaasAuthorizeResult {
    status: UnipaasAuthorizationStatus;
    transactionType: UnipaasTransactionType;
    transactionStatus: UnipaasAuthorizationStatus;
    authorizationId: string;
    authorizationStatus: UnipaasAuthorizationStatus;
    transactionId: string;
    consumerId: string;
    sellerIdentity: string;
    currency: string;
    transactionAmount: number;
    declineCode: string;
    redirectUrl?: string;
    orderId: string;
}

export interface UnipaasTransaction {
    id: string;
    authorizationId: string;
    paymentOptionId: string;
    paymentOptionType: string;
    merchantId: string;
    country: string;
    paymentMethod: string;
    brand: string;
    transactionType: string;
    currency: string;
    amount: number;
    orderid: string;
    transactionResult: string;
    processorTransactionId: string;
    program: string;
    fundsFlow: string;
    items: any[];
    createdAt: string;
    updatedAt: string;
    processorErrorReason: string;
}

export interface UnipaasPayInTokenParams {
    country: string;
    email: string;
}

export interface UnipaasPayInTokenResponse {
    sessionToken: string;
}

export interface NewUnipaasConsumer {
    firstName?: string;
    lastName?: string;
    email: string;
    country: string;
    ipAddress?: string;
}

export interface UnipaasAuthorizeParams {
    amount: number;
    currency: string;
    orderId: string;
    paymentOption?: NewUnipaasPaymentOption;
    paymentOptionId?: string;
    consumer: NewUnipaasConsumer;
    items?: UnipaasCheckoutItem[];
    urls?: {
        redirectUrl?: string;
    };
}