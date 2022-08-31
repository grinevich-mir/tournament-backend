import { TransactionPurpose } from '../transaction-purpose';
import { TransactionDescriptor } from './transfer-descriptor';
import { RequesterType } from '../requester-type';

export interface TransferConfig {
    amount: number;
    currencyCode: string;
    purpose: TransactionPurpose;
    memo: string;
    requesterType: RequesterType;
    requesterId: string | number;
    externalRef: string;
    descriptors: TransactionDescriptor[];
    linkedEntryId: number;
}