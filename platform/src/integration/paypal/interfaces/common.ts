export enum PayPalHttpMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
    HEAD = 'HEAD',
    CONNECT = 'CONNECT',
    OPTIONS = 'OPTIONS',
    PATCH = 'PATCH'
}

export interface PayPalMoney {
    currency_code: string;
    value: string;
}

export interface PayPalAddress {
    address_line_1?: string;
    address_line_2?: string;
    admin_area_1?: string;
    admin_area_2?: string;
    postal_code?: string;
    country_code: string;
}

export interface PayPalPhone {
    phone_type: string;
    phone_number: PayPalPhoneNumber;
}

export interface PayPalPhoneNumber {
    national_number: string;
}

export interface PayPalTaxInfo {
    tax_id: string;
    tax_id_type: string;
}

export interface PayPalLinkDescription {
    href: string;
    rel: string;
    method?: PayPalHttpMethod;
}

export enum PayPalLinkRelationType {
    Self = 'self',
    Approve = 'approve',
    Update = 'update',
    Capture = 'capture',
    Up = 'up'
}