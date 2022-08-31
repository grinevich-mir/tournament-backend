import { AdminController, Route, Tags, Security, Get, Path, Put, Post, Body, Delete, Query } from '@tcom/platform/lib/api';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError } from '@tcom/platform/lib/core';
import { ReferralCommissionManager, NewReferralCommissionRate, ReferralCommissionRateUpdate, ReferralCommissionRate, ReferralCommissionRateFilter } from '@tcom/platform/lib/referral';
import { Inject } from '@tcom/platform/lib/core/ioc';

@Tags('Commission')
@Route('referral/commission')
@Security('admin')
@LogClass()
export class CommissionController extends AdminController {
    constructor(@Inject private readonly manager: ReferralCommissionManager) {
        super();
    }

    @Get('rate')
    @Security('admin', ['referral:commission:read'])
    public async getRates(
        @Query() groupId?: number,
        @Query() enabled?: boolean
    ): Promise<ReferralCommissionRate[]> {
        const filter: ReferralCommissionRateFilter = {
            groupId,
            enabled
        };

        return this.manager.getRates(filter);
    }

    @Get('rate/{groupId}/{level}')
    @Security('admin', ['referral:commission:read'])
    public async getRate(@Path() groupId: number, @Path() level: number): Promise<ReferralCommissionRate> {
        const rate = await this.manager.getRate(groupId, level);

        if (!rate)
            throw new NotFoundError('Referral commission rate not found.');

        return rate;
    }

    @Post('rate/{groupId}/{level}')
    @Security('admin', ['referral:commission:write'])
    public async addRate(@Path() groupId: number, @Path() level: number, @Body() rate: NewReferralCommissionRate): Promise<ReferralCommissionRate> {
        return this.manager.addRate(groupId, level, rate);
    }

    @Put('rate/{groupId}/{level}')
    @Security('admin', ['referral:commission:write'])
    public async updateRate(@Path() groupId: number, @Path() level: number, @Body() rate: ReferralCommissionRateUpdate): Promise<ReferralCommissionRate> {
        return this.manager.updateRate(groupId, level, rate);
    }

    @Delete('rate/{groupId}/{level}')
    @Security('admin', ['referral:commission:delete'])
    public async removeRate(@Path() groupId: number, @Path() level: number): Promise<void> {
        await this.manager.removeRate(groupId, level);
    }
}
