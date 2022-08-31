export enum ChargifyPaymentType {
    CreditCard = 'credit_card',
    BankAccount = 'bank_account',
    PayPal = 'paypal_account'
}

interface ChargifyPaymentProfileBase {
    id: number;
    type: ChargifyPaymentType;
    first_name: string;
    last_name: string;
    billing_address?: string;
    billing_address_2?: string;
    billing_city?: string;
    billing_state?: string;
    billing_country?: string;
    billing_zip?: string;
    customer_id: number;
    current_vault?: string;
    customer_vault_token?: string;
    disabled: boolean;
}

export interface ChargifyCreditCardPaymentProfile extends ChargifyPaymentProfileBase {
    payment_type: ChargifyPaymentType.CreditCard;
    masked_card_number: string;
    card_type: string;
    expiration_month: number;
    expiration_year: number;
}

export interface ChargifyBankAccountPaymentProfile extends ChargifyPaymentProfileBase {
    payment_type: ChargifyPaymentType.BankAccount;
    bank_name: string;
    masked_bank_routing_number: string;
    masked_bank_account_number: string;
    bank_account_type: string;
    bank_account_holder_type: string;
    verified: boolean;
}

export type ChargifyPaymentProfile = ChargifyCreditCardPaymentProfile | ChargifyBankAccountPaymentProfile;

export interface ChargifyCreditCardAttributes {
    chargify_token?: string;
}

export interface ChargifyBankAccountAttributes {
    chargify_token?: string;
}

export interface ListPaymentProfilesParameters {
    page?: number;
    per_page?: number;
    customer_id?: number;
}

export interface CreatePaymentProfileRequest {
    payment_profile: (ChargifyCreditCardAttributes | ChargifyBankAccountAttributes) & { customer_id: number };
}

export interface UpdatePaymentProfileRequest {
    payment_profile: ChargifyCreditCardAttributes | ChargifyBankAccountAttributes;
}
