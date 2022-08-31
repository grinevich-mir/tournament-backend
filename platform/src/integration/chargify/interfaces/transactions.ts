export enum ChargifyTransactionType {
    Charge = 'charge',
    Credit = 'credit',
    Adjustment = 'adjustment',
    Payment = 'payment',
    Refund = 'refund',
    InfoTransaction = 'InfoTransaction',
    Info = 'info',
    PaymentAuthorization = 'payment_authorization'
}

export enum ChargifyTransactionKind {
    Trial = 'trial',
    Initial = 'initial',
    Baseline = 'baseline',
    OneTime = 'one_time',
    DelayCapture = 'delay_capture',
    QuantityBasedComponent = 'quantity_based_component',
    OnOffComponent = 'on_off_component',
    MeteredComponent = 'metered_component',
    Metered = 'metered',
    Tax = 'tax',
    Coupon = 'coupon',
    Prorated = 'prorated',
    Reactivation = 'reactivation',
    Referral = 'referral',
    VoidedInvoice = 'voided_invoice',
    Cancelation = 'cancelation',
    ComponentProration = 'componenent_proration',
    Manual = 'manual'
}

export interface ChargifyTransaction {
    id: number;
    transaction_type: ChargifyTransactionType;
    amount_in_cents: number;
    created_at: string;
    gateway_transaction_id: string;
    gateway_order_id: string;
    gateway_used: string;
    starting_balance_in_cents: number;
    ending_balance_in_cents: number;
    memo: string;
    subscription_id: number;
    product_id: number;
    currency: string;
    success: boolean;
    payment_id?: number;
    exchange_rate: number;
    kind: ChargifyTransactionKind;
    component_id: number;
    customer_id: number;
    item_name: string;
    period_range_start: string;
    period_range_end: string;
    refunded_amount_in_cents?: number;
    card_number?: string;
    card_type?: string;
    card_expiration?: string;
}