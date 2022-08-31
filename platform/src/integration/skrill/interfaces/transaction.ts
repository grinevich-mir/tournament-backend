import { SkrillCustomer } from './customer';

export enum SkrillTransactionStatus {
    Processed = 2,
    Pending = 0,
    Cancelled = -1,
    Failed = -2,
    Chargeback = -3
}

export interface SkrillTransaction {
    id: string;
    amount: number;
    currencyCode: string;
    status: SkrillTransactionStatus;
    customer: SkrillCustomer;
}