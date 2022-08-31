import { SkrillTransactionStatus } from './transaction';

export interface SkrillStatusReport {
    pay_to_email: string;
    pay_from_email: string;
    merchant_id: string;
    customer_id: string;
    transaction_id: string;
    mb_transaction_id: string;
    mb_amount: number;
    mb_currency: string;
    status: SkrillTransactionStatus;
    failed_reason_code?: string;
    md5sig: string;
    sha2sig?: string;
    amount: number;
    currency: string;
    neteller_id: string;
    payment_type: any;
    merchant_fields: any;
}

export enum SkrillStatusReportAction {
    GetTransactionStatus = 'status_trn',
    RepostTransactionStatus = 'repost'
}

export interface SkrillStatusReportParams {
    email: string;
    password: string;
    action: SkrillStatusReportAction;
}

export interface SkrillGetTransactionStatusParams extends SkrillStatusReportParams {
    mb_trn_id: number;
}