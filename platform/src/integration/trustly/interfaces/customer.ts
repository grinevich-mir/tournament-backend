import { TrustlyAddress } from './common';

export interface TrustlyCustomerDrivingLicense {
    number: string;
    state: string;
}

export interface TrustlyNewCustomer {
    externalId: string;
    name?: string;
    email?: string;
    address?: TrustlyAddress;
    phone?: string;
    enrollDate?: number;
    taxId?: string;
}

export interface TrustlyCustomer extends TrustlyNewCustomer {
    customerId: string;
    merchantId: string;
    drivingLicense?: TrustlyCustomerDrivingLicense;
    createdAt: number;
    updatedAt: number;
}