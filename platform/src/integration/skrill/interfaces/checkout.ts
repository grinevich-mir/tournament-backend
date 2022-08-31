export interface SkrillCheckoutParams {
    prepare_only: '1';
    recipient_description?: string;
    transaction_id?: string;
    return_url?: string;
    return_url_text?: string;
    return_url_target?: '_top' | '_parent' | '_self' | '_blank';
    cancel_url?: string;
    cancel_url_target?: '_top' | '_parent' | '_self' | '_blank';
    logo_url?: string;
    language?: string;
    sid?: string;
    rid?: string;
    ext_ref_id?: string;
    merchant_fields?: string;
    pay_from_email?: string;
    firstname?: string;
    lastname?: string;
    date_of_birth?: string;
    address?: string;
    address2?: string;
    postal_code?: string;
    city?: string;
    state?: string;
    country?: string;
    amount: number;
    currency: string;
    detail1_description?: string;
    detail1_text?: string;
    phone_number?: number;
    pay_to_email: string;
    merchant_id?: string;
    status_url: string;
    status_url2?: string;
}

export type SkrillPrepareCheckoutParams = Omit<SkrillCheckoutParams, 'pay_to_email' | 'merchant_id' | 'status_url' | 'status_url2' | 'prepare_only'>;