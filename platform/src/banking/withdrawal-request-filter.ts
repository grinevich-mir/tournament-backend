import { WithdrawalRequestStatus } from './withdrawal-request-status';
import { WithdrawalRequest } from './withdrawal-request';
import { PagedFilter } from '../core';
import { WithdrawalProvider } from './withdrawal-provider';

export interface WithdrawalRequestFilter extends PagedFilter<WithdrawalRequest> {
    userId?: number;
    status?: WithdrawalRequestStatus;
    provider?: WithdrawalProvider;
}

export interface WithdrawalRequestIdFilter {
    ids: string[];
}