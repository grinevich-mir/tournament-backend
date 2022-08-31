import { TransactionPurpose } from './transaction-purpose';
import { RequesterType } from './requester-type';

export interface WalletTransaction {
    id: number;
    walletId: number;
    accountId: number;
    entryId: number;
    purpose: TransactionPurpose;
    currencyCode: string;
    exchangeRate: number;
    amount: number;
    amountRaw: number;
    baseAmount: number;
    requesterType: RequesterType;
    requesterId: string;
    createTime: Date;
}