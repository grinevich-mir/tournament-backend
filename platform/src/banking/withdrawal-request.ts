import { RequesterType } from './requester-type';
import { WithdrawalRequestStatus } from './withdrawal-request-status';
import { WithdrawalProvider } from './withdrawal-provider';

export interface NewWithdrawalRequest {
    provider: WithdrawalProvider;
    userId: number;
    amount: number;
    providerRef?: string;
    targetCompletionTime: Date;
}

export interface WithdrawalRequest extends NewWithdrawalRequest {
    id: string;
    walletEntryId: number;
    currencyCode: string;
    requesterType: RequesterType;
    requesterId: string;
    status: WithdrawalRequestStatus;
    completionTime?: Date;
    createTime: Date;
    updateTime: Date;
}