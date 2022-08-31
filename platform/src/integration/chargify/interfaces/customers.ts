export interface ChargifyCustomerAttributes {
    first_name: string;
    last_name: string;
    email: string;
    cc_emails?: string;
    organization?: string;
    reference?: string;
    address?: string;
    address_2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
    parent_id?: number;
    verified?: boolean;
    tax_exempt?: boolean;
    vat_number?: string;
}

export interface ChargifyCustomer extends ChargifyCustomerAttributes {
    id: number;
    created_at?: string;
    updated_at?: string;
    portal_customer_created_at?: string;
    portal_invite_last_sent_at?: string;
    portal_invite_last_accepted_at?: string;
}

export interface CreateCustomerRequest {
    customer: ChargifyCustomerAttributes;
}

export interface UpdateCustomerRequest {
    customer: ChargifyCustomerAttributes;
}