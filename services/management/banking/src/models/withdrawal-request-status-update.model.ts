import { WithdrawalRequestStatus, WithdrawalRequestStatusChangeResult } from '@tcom/platform/lib/banking';

export interface WithdrawalRequestStatusUpdateModel {
    status: WithdrawalRequestStatus;
}

export interface WithdrawalRequestStatusBulkUpdateModel {
    status: WithdrawalRequestStatus;
    ids: string[];
}

export interface WithdrawalRequestStatusBulkUpdateResultModel {
    success: boolean;
    results: WithdrawalRequestStatusChangeResult[];
}