import { TransactionPurpose } from '../transaction-purpose';

export interface WalletTransactionModel {
    id: number;
    account: string;
    amount: number;
    currencyCode: string;
    purpose: TransactionPurpose;
    createTime: Date;
}