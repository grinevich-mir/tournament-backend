import { WithdrawalRequestStatus } from '../withdrawal-request-status';
import { WithdrawalProvider } from '../withdrawal-provider';

export interface WithdrawalRequestModel {
    id: string;
    provider: WithdrawalProvider;
    providerRef?: string;
    amount: number;
    currencyCode: string;
    status: WithdrawalRequestStatus;
    targetCompletionTime: Date;
    completionTime?: Date;
    createTime: Date;
    updateTime: Date;
}