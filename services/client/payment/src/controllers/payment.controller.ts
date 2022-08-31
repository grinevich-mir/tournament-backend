import { Route, Security, Tags, ClientController, Get, Query, Response } from '@tcom/platform/lib/api';
import { PagedResult, UnauthorizedError } from '@tcom/platform/lib/core';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PaymentFilter, PaymentManager } from '@tcom/platform/lib/payment';
import { PaymentModel, PaymentModelMapper } from '@tcom/platform/lib/payment/models';

@Tags('Payment')
@Route('payment')
@Security('cognito')
@LogClass()
export class PaymentController extends ClientController {
    constructor(
        @Inject private readonly paymentManager: PaymentManager,
        @Inject private readonly mapper: PaymentModelMapper) {
        super();
    }

    /**
     * @summary Gets the payments for the authenticated user
     * @isInt page
     * @isInt pageSize
     */
    @Get()
    @Response<UnauthorizedError>(401)
    public async getAll(@Query() page: number = 1, @Query() pageSize: number = 20): Promise<PagedResult<PaymentModel>> {
        const filter: PaymentFilter = {
            userId: this.user.id,
            page,
            pageSize,
            order: {
                createTime: 'DESC'
            }
        };

        const result = await this.paymentManager.getAll(filter);
        const models = result.items.map(p => this.mapper.map(p));
        return new PagedResult(models, result.totalCount, result.page, result.pageSize);
    }
}
