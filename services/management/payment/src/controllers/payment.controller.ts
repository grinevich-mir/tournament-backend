import { AdminController, Route, Tags, Query, Get, Security } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PagedResult } from '@tcom/platform/lib/core';
import { Payment, PaymentFilter, PaymentManager, PaymentProvider, PaymentStatus, PaymentType } from '@tcom/platform/lib/payment';

@Tags('Payment')
@Route('payment')
@LogClass()
export class SubscriptionPaymentController extends AdminController {
    constructor(
        @Inject private readonly paymentManager: PaymentManager) {
        super();
    }

    /**
     * @summary Gets all payments
     * @param userId A users ID
     */
    @Get()
    @Security('admin', ['payment:read'])
    public async getAll(
        @Query() userId?: number,
        @Query() provider?: PaymentProvider,
        @Query() status?: PaymentStatus,
        @Query() type?: PaymentType,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<Payment>> {
        const filter: PaymentFilter = {
            userId,
            provider,
            type,
            status,
            page,
            pageSize,
            order: {
                createTime: 'DESC'
            }
        };

        return this.paymentManager.getAll(filter);
    }
}
