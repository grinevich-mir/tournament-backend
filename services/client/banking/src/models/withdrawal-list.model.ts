import { WithdrawalRequestModel } from '@tcom/platform/lib/banking/models';
import { PagedResult } from '@tcom/platform/lib/core';

export class WithdrawalListModel extends PagedResult<WithdrawalRequestModel> {
    public minAmount!: number;
}