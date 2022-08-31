import { AdminController, Get, Body, Path, Route, Tags, Put, Query, Security } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { VerificationManager, VerificationRequestState, VerificationRequest, VerificationErrorReason, VerificationRequestFilter } from '@tcom/platform/lib/verification';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Verification')
@Route('verification')
@LogClass()
export class VerificationController extends AdminController {
    constructor(
        @Inject private readonly verificationManager: VerificationManager) {
        super();
    }

    /**
     * @summary Gets all verifications
     */
    @Get()
    @Security('admin', ['verification:read'])
    public async getAll(
        @Query() userId?: number,
        @Query() states?: VerificationRequestState[],
        @Query() displayName?: string,
        @Query() level?: number,
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() order?: string,
        @Query() direction?: 'ASC' | 'DESC'): Promise<PagedResult<VerificationRequest>> {

        const filter: VerificationRequestFilter = {
            userId,
            fields: {
                displayName,
                level
            },
            page,
            pageSize
        };

        if (order)
            filter.order = {
                [`${order}`]: direction || 'ASC'
            };

        if (states && states.length > 0)
            filter.states = states;

        return this.verificationManager.getAll(filter);
    }

    /**
     * @summary Gets all verifications
     */
    @Get('{id}')
    @Security('admin', ['verification:read'])
    public async get(@Path('id') id: string): Promise<VerificationRequest> {
        const request = await this.verificationManager.get(id);

        if (!request)
            throw new NotFoundError('Verification request not found.');

        if (request.attachments && request.attachments.length > 0)
            for (const [i, attachment] of request.attachments.entries())
                request.attachments[i].url = await this.verificationManager.getAttachmentUrl(request, attachment);

        return request;
    }

    /**
     * @summary Set verification request state to Complete
     */
    @Put('{id}/complete')
    @Security('admin', ['verification:write'])
    public async setComplete(@Path('id') id: string): Promise<void> {
        await this.verificationManager.setRequestState(id, VerificationRequestState.Complete);
    }

    /**
     *
     * @summary Set verification request state to error with optional reason
     */
    @Put('{id}/fail')
    @Security('admin', ['verification:write'])
    public async setError(@Path('id') id: string, @Body() reason: VerificationErrorReason): Promise<void> {
        await this.verificationManager.setRequestState(id, VerificationRequestState.Error, reason);
    }
}
