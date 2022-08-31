import { ChargifyCustomer, ChargifyCustomerAttributes } from './customers';
import {
    ChargifyBankAccountAttributes,
    ChargifyBankAccountPaymentProfile,
    ChargifyCreditCardAttributes,
    ChargifyCreditCardPaymentProfile,
    ChargifyPaymentType
} from './payment-profiles';
import { ChargifyProduct } from './products';

export enum ChargifySubscriptionState {
    Active = 'active',
    Canceled = 'canceled',
    Expired = 'expired',
    OnHold = 'on_hold',
    PastDue = 'past_due',
    SoftFailure = 'soft_failure',
    Trialing = 'trialing',
    TrialEnded = 'trial_ended',
    Unpaid = 'unpaid',
    Suspended = 'suspended'
}

export interface NewChargifySubscription {
    product_handle?: string;
    product_id?: string;
    product_price_point_handle?: string;
    coupon_code?: string;
    payment_collection_method?: string;
    receives_invoice_emails?: boolean;
    net_terms?: string;
    customer_id?: number;
    next_billing_at?: string;
    stored_credential_transaction_id?: number;
    sales_rep_id?: number;
    payment_profile_id?: number;
    reference?: string;
    customer_attributes?: ChargifyCustomerAttributes;
    credit_card_attributes?: ChargifyCreditCardAttributes;
    bank_account_attributes?: ChargifyBankAccountAttributes;
    currency?: string;
}


export interface ChargifySubscription {
    id: number;
    state: ChargifySubscriptionState;
    balance_in_cents: number;
    total_revenue_in_cents: number;
    product_price_in_cents: number;
    product_version_number: number;
    current_period_ends_at?: string;
    next_assessment_at?: string;
    next_product_price_point_id?: number;
    trial_started_at?: string;
    trial_ended_at?: string;
    activated_at?: string;
    expires_at?: string;
    created_at?: string;
    updated_at?: string;
    reference?: string;
    cancellation_message?: string;
    cancellation_method?: string;
    cancel_at_end_of_period?: boolean;
    canceled_at?: string;
    current_period_started_at?: string;
    previous_state?: string;
    signup_payment_id?: number;
    signup_revenue?: string;
    delayed_cancel_at?: string;
    coupon_code?: string;
    payment_collection_method?: string;
    snap_day?: number;
    reason_code?: string;
    receives_invoice_emails?: boolean;
    customer: ChargifyCustomer;
    product: ChargifyProduct;
    credit_card?: ChargifyCreditCardPaymentProfile;
    bank_account?: ChargifyBankAccountPaymentProfile;
    payment_type?: ChargifyPaymentType;
    referral_code?: string;
    next_product_id?: number;
    coupon_use_count?: number;
    coupon_uses_allowed?: number;
    next_product_handle?: string;
    stored_credential_transaction_id?: number;
    currency?: string;
    on_hold_at?: string;
    scheduled_cancellation_at?: string;
    automatically_resume_at?: string;
}

export interface CreateSubscriptionRequest {
    subscription: NewChargifySubscription;
}

export interface UpdateSubscriptionRequest {
    subscription: {
        next_billing_at?: string;
        snap_day?: number | 'end';
    };
}