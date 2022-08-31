import { TransactionPurpose } from './transaction-purpose';
import { RequesterType } from './requester-type';
import { WalletTransaction } from './wallet-transaction';

export interface WalletEntry {
    id: number;
    memo?: string;
    purpose: TransactionPurpose;
    requesterType: RequesterType;
    requesterId: string;
    externalRef?: string;
    linkedEntryId?: number;
    transactions?: WalletTransaction[];
    createTime: Date;
}