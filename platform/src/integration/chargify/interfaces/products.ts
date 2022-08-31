export interface ChargifyProductFamily {
    id: number;
    name: string;
    handle: string;
    accounting_code?: string;
    description?: string;
}

export interface ChargifyProduct {
    id: number;
    name: string;
    handle: string;
    description?: string;
    accounting_code?: string;
    price_in_cents: number;
    interval: number;
    interval_unit: string;
    initial_charge_in_cents?: number;
    expiration_interval?: number;
    expiration_interval_unit?: string;
    trial_price_in_cents?: number;
    trial_interval?: number;
    trial_interval_unit?: string;
    initial_charge_after_trial?: boolean;
    return_params?: string;
    request_credit_card: boolean;
    require_credit_card: boolean;
    created_at: string;
    updated_at: string;
    archived_at?: string;
    update_return_url?: string;
    update_return_params?: string;
    product_family: ChargifyProductFamily;
    taxable: boolean;
    version_number: number;
    product_price_point_name: string;
    product_price_point_handle: string;
}

export interface ChargifyProductPricePoint {
    id: number;
    name: string;
    handle: string;
    price_in_cents: number;
    interval: number;
    interval_unit: string;
    trial_price_in_cents?: number;
    trial_interval?: number;
    trial_interval_unit?: string;
    trial_type?: string;
    introductory_offer?: boolean;
    initial_charge_in_cents?: number;
    initial_charge_after_trial?: boolean;
    expiration_interval?: number;
    expiration_interval_unit?: string;
    product_id: number;
    archived_at: string;
    created_at: string;
    updated_at: string;
    use_site_exchange_rate: boolean;
}