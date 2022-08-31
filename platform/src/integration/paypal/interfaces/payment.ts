import { PayPalAddress, PayPalLinkDescription, PayPalMoney } from './common';
import { PayPalPayee } from './merchant';

export type PayPalPayments = {
    captures?: PayPalPaymentCapture[];
};

export enum PayPalPaymentInitiator {
    Customer = 'CUSTOMER',
    Merchant = 'MERCHANT'
}

export enum PayPalPaymentType {
    OneTime = 'ONE_TIME',
    Recurring = 'RECURRING',
    Unscheduled = 'UNSCHEDULED'
}

export enum PayPalStoredPaymentSourceUsage {
    First = 'FIRST',
    Subsequent = 'SUBSEQUENT',
    Derived = 'DERIVED'
}

export interface PayPalStoredPaymentSource {
    payment_initiator: PayPalPaymentInitiator;
    payment_type: PayPalPaymentType;
    usage?: PayPalStoredPaymentSourceUsage;
}

export enum PayPalPaymentCardType {
    Credit = 'CREDIT',
    Debit = 'DEBIT',
    Prepaid = 'PREPAID',
    Unknown = 'UNKNOWN'
}

export interface PayPalPaymentCardResponse {
    name: string;
    billing_address: PayPalAddress;
    last_digits: string;
    brand: string;
    type: PayPalPaymentCardType;
}

export interface PayPalPaymentSource {
    card: PayPalPaymentCardResponse;
    paypal: boolean;
}

export enum PayPalStandardEntryClassCode {
    TEL = 'TEL',
    WEB = 'WEB',
    CCD = 'CCD',
    PPD = 'PPD'
}

export interface PayPalPaymentMethod {
    payer_selected?: string;
    payee_preferred: PayPalPaymentType;
    standard_entry_class_codeenum: PayPalStandardEntryClassCode;
}

export interface PayPalPlatformFee {
    amount: PayPalMoney;
    payee?: PayPalPayee;
}

export enum PayPalDisburstmentMode {
    Instant = 'INSTANT',
    Delayed = 'DELAYED'
}

export interface PayPalPaymentInstruction {
    platform_fees: PayPalPlatformFee[];
    disbursement_mode: PayPalDisburstmentMode;
    payee_pricing_tier_id?: string;
}

export enum PayPalPaymentStatus {
    Completed = 'COMPLETED',
    Declined = 'DECLINED',
    PartiallyRefunded = 'PARTIALLY_REFUNDED',
    Pending = 'PENDING',
    Refunded = 'REFUNDED',
    Failed = 'FAILED'
}

export interface PayPalPaymentCapture {
    id: string;
    status: PayPalPaymentStatus;
    status_details?: {
        reason: string;
    };
    amount: PayPalMoney;
    invoice_id: string;
    custom_id: string;
    seller_protection: {
        status: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE',
        dispute_categories: string[]
    };
    supplementary_data?: {
        related_ids?: {
            order_id: string;
        }
    };
    final_capture: boolean;
    links: PayPalLinkDescription[];
    create_time: string;
    update_time?: string;
}