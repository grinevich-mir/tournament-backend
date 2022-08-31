import { PayPalAddress, PayPalLinkDescription, PayPalMoney } from './common';
import { PayPalPayer } from './customer';
import { PayPalPayee } from './merchant';
import { PayPalPayments, PayPalPaymentInstruction, PayPalPaymentMethod, PayPalPaymentSource, PayPalStoredPaymentSource } from './payment';

export enum PayPalCheckoutPaymentIntent {
    Capture = 'CAPTURE',
    Authorize = 'AUTHORIZE'
}

export enum PayPalOrderStatus {
    Created = 'CREATED',
    Saved = 'SAVED',
    Approved = 'APPROVED',
    Voided = 'VOIDED',
    Completed = 'COMPLETED',
    Payer_Action_Required = 'PAYER_ACTION_REQUIRED'
}

export interface PayPalOrderContext {
    brand_name?: string;
    locale?: string;
    landing_page?: 'LOGIN' | 'BILLING' | 'NO_PREFERENCE';
    shipping_preference?: 'GET_FROM_FILE' | 'NO_SHIPPING' | 'SET_PROVIDED_ADDRESS';
    user_action?: 'CONTINUE' | 'PAY_NOW';
    payment_method?: PayPalPaymentMethod;
    return_url?: string;
    cancel_url?: string;
    stored_payment_source?: PayPalStoredPaymentSource;
}

export interface PayPalOrderParams {
    intent: PayPalCheckoutPaymentIntent;
    purchase_units: PayPalPurchaseUnit[];
    payer?: PayPalPayer;
    application_context?: PayPalOrderContext;
}

export interface PayPalOrder {
    id: string;
    intent: PayPalCheckoutPaymentIntent;
    purchase_units: PayPalPurchaseUnit[];
    payment_source: PayPalPaymentSource;
    payer: PayPalPayer;
    status: PayPalOrderStatus;
    links: PayPalLinkDescription[];
    create_time: string;
    update_time?: string;
}

export interface PayPalPurchaseUnit {
    reference_id?: string;
    amount: PayPalOrderAmount;
    payee?: PayPalPayee;
    description?: string;
    custom_id?: string;
    invoice_id?: string;
    soft_descriptor?: string;
    items?: PayPalItem[];
    shipping?: PayPalShippingInfo;
    payment_instruction?: PayPalPaymentInstruction;
    payments?: PayPalPayments;
}

export interface PayPalOrderAmount extends PayPalMoney {
    breakdown?: PayPalOrderAmountBreakdown;
}

export interface PayPalOrderAmountBreakdown {
    item_total?: PayPalMoney;
    shipping?: PayPalMoney;
    handling?: PayPalMoney;
    tax_total?: PayPalMoney;
    insurance?: PayPalMoney;
    shipping_discount?: PayPalMoney;
    discount?: PayPalMoney;
}

export interface PayPalItem {
    name: string;
    unit_amount: PayPalMoney;
    tax?: PayPalMoney;
    quantity: number;
    description?: string;
    sku?: string;
    category: 'DIGITAL_GOODS' | 'PHYSICAL_GOODS' | 'DONATION';
}

export interface PayPalShippingInfo {
    name: {
        full_name: string;
    };
    type: 'SHIPPING' | 'PICKUP_IN_PERSON';
    address: PayPalAddress;
}

export interface PayPalRefund {
    id: string;
    status: PayPalOrderStatus;
    status_details: {
        reason: string;
    };
    amount: PayPalMoney;
    custom_id: string;
    note_to_payer?: string;
    links: PayPalLinkDescription[];
    create_time: string;
    update_time?: string;
}