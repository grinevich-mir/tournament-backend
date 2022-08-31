import { WithdrawalRequest } from '@tcom/platform/lib/banking';

export interface WithdrawalRequestEnrichedModel extends WithdrawalRequest {
    username?: string;
}
