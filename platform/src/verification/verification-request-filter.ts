import { PagedFilter } from '../core';
import { VerificationRequest } from './verification-request';
import { VerificationRequestState } from './verification-request-state';

export interface VerificationRequestFilter extends PagedFilter<VerificationRequest> {
    userId?: number;
    states?: VerificationRequestState[];
    expired?: boolean;
    fields?: {
        displayName?: string;
        level?: number;
    };
}