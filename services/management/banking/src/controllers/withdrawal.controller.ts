import { AdminController, Get, Route, Tags, Path, Query, Security, Patch, Body, Post, FileResult } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { WithdrawalRequestStatus, WithdrawalManager, WithdrawalRequestFilter, WithdrawalProvider, WithdrawalRequestExporterFactory, WithdrawalRequestIdFilter, WithdrawalRequestStatusChangeResult } from '@tcom/platform/lib/banking';
import { BadRequestError, NotFoundError, PagedResult, ForbiddenError } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { WithdrawalRequestStatusBulkUpdateModel, WithdrawalRequestStatusBulkUpdateResultModel, WithdrawalRequestStatusUpdateModel } from '../models/withdrawal-request-status-update.model';
import { UserManager } from '@tcom/platform/lib/user';
import { WithdrawalRequestEnrichedModel } from '../models/withdrawal-request-enriched.model';

@Tags('Withdrawals')
@Route('banking/withdrawal')
@LogClass()
export class WithdrawalController extends AdminController {
    constructor(
        @Inject private readonly manager: WithdrawalManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly factory: WithdrawalRequestExporterFactory) {
        super();
    }

    /**
     * @summary Gets all withdrawal requests
     * @isInt page
     * @isInt pageSize
     */
    @Get()
    @Security('admin', ['banking:withdrawal:read'])
    public async getAll(
        @Query() userId?: number,
        @Query() status?: WithdrawalRequestStatus,
        @Query() provider?: WithdrawalProvider,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<WithdrawalRequestEnrichedModel>> {
        const filter: WithdrawalRequestFilter = {
            userId,
            status,
            provider,
            page,
            pageSize
        };

        const result = await this.manager.getAll(filter);

        return {
            ...result,
            items: await Promise.all(result.items.map(async (request) => {
                const user = await this.userManager.get(request.userId);
                return {
                    ...request,
                    username: user ? user.displayName : undefined,
                    fraudulent: user && user.fraudulent
                };
            }))
        };
    }

    /**
     * @summary Gets a withdrawal request by ID
     */
    @Get('{id}')
    @Security('admin', ['banking:withdrawal:read'])
    public async getById(@Path() id: string): Promise<WithdrawalRequestEnrichedModel> {
        const request = await this.manager.get(id);

        if (!request)
            throw new NotFoundError('Withdrawal request not found.');

        const user = await this.userManager.get(request.userId);

        return {
            ...request,
            username: user ? user.displayName : undefined
        };
    }

    /**
     * @summary Change the withdrawal request status
     */
    @Patch('{id}')
    @Security('admin', ['banking:withdrawal:write'])
    public async changeStatus(@Path() id: string, @Body() update: WithdrawalRequestStatusUpdateModel): Promise<void> {
        const request = await this.manager.get(id);

        if (!request)
            throw new NotFoundError('Withdrawal request not found.');

        const user = await this.userManager.get(request.userId);

        if (user?.fraudulent)
            throw new ForbiddenError('User is under review');

        switch (update.status) {
            case WithdrawalRequestStatus.Processing:
                await this.manager.processing(id);
                break;

            case WithdrawalRequestStatus.Complete:
                await this.manager.complete(id, this.user.id);
                break;

            case WithdrawalRequestStatus.Cancelled:
                await this.manager.cancel(id, this.user.id);
                break;
        }
    }

    /**
     * @summary Change the status for multiple withdrawal requests
     */
    @Patch('bulk/status')
    @Security('admin', ['banking:withdrawal:write'])
    public async bulkChangeStatus(@Body() update: WithdrawalRequestStatusBulkUpdateModel): Promise<WithdrawalRequestStatusBulkUpdateResultModel> {
        if (update.ids.length === 0)
            throw new BadRequestError('No withdrawal request IDs supplied');

        const results = await this.manager.bulkChangeStatus(update.status, update.ids, this.user.id);

        return {
            results,
            success: results.every((r: WithdrawalRequestStatusChangeResult) => r.success)
        };
    }

    /**
     * @summary Exports withdrawal requests by ID
     * @param provider Withdrawal Provider
     */
    @Post('{provider}/export')
    @Security('admin', ['banking:withdrawal:read'])
    public async export(@Path() provider: WithdrawalProvider, @Body() filter: WithdrawalRequestIdFilter): Promise<FileResult> {
        if (filter.ids.length === 0)
            throw new BadRequestError('No withdrawal request IDs supplied');

        const exporter = this.factory.create(provider);
        const requests = await this.manager.getMany(...filter.ids);
        const model = exporter.export(requests);

        return this.file(model.data, model.fileName, 'text/csv');
    }
}
