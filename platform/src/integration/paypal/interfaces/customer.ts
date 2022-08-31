import { PayPalAddress, PayPalPhoneNumber, PayPalTaxInfo } from './common';

export interface PayPalPayerName {
    given_name?: string;
    surname?: string;
}

export interface PayPalPayer {
    email_address: string;
    payer_id: string;
    name: PayPalPayerName;
    phone: PayPalPhoneNumber;
    birth_date: string;
    tax_info: PayPalTaxInfo;
    address: PayPalAddress;
}