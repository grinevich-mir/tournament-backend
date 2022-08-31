import { AdminController, Route, Tags, Security, Get, Path, Query, Post, Body } from '@tcom/platform/lib/api';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PagedResult, NotFoundError } from '@tcom/platform/lib/core';
import { Referral, ReferralManager, ReferralFilter, ReferralRewardFilter, ReferralReward } from '@tcom/platform/lib/referral';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NewReferralModel, ReferralModel } from '../models';
import { ReferralModelMapper } from '../models/mappers';

@Tags('Referrals')
@Route('referral')
@Security('admin')
@LogClass()
export class ReferralController extends AdminController {
    constructor(
        @Inject private readonly manager: ReferralManager,
        @Inject private readonly mapper: ReferralModelMapper) {
        super();
    }

    @Get()
    @Security('admin', ['referral:read'])
    public async getAll(
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() order: string = 'createTime',
        @Query() direction: 'ASC' | 'DESC' = 'DESC'): Promise<PagedResult<ReferralModel>> {
        const filter: ReferralFilter = {
            page,
            pageSize
        };

        if (order && direction)
            filter.order = {
                [`${order}`]: direction
            };

        const result = await this.manager.getAll(filter);
        const models = await Promise.all(result.items.map(r => this.mapper.map(r)));
        return new PagedResult(models, result.totalCount, result.page, result.pageSize);
    }

    @Post()
    @Security('admin', ['referral:write'])
    public async add(@Body() referral: NewReferralModel): Promise<ReferralModel> {
        const created = await this.manager.add(referral.referrerId, referral.refereeId);
        return this.mapper.map(created);
    }

    @Get('referrer/{referrerId}')
    @Security('admin', ['referral:read'])
    public async getByReferrer(
        @Path() referrerId: number,
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() order?: string,
        @Query() direction?: 'ASC' | 'DESC'): Promise<PagedResult<ReferralModel>> {
        const filter: ReferralFilter = {
            page,
            pageSize
        };

        if (order && direction)
            filter.order = {
                [`${order}`]: direction
            };

        const result = await this.manager.getByReferrer(referrerId, filter);
        const models = await Promise.all(result.items.map(r => this.mapper.map(r)));
        return new PagedResult(models, result.totalCount, result.page, result.pageSize);
    }

    @Get('referee/{refereeId}')
    @Security('admin', ['referral:read'])
    public async getByReferee(@Path() refereeId: number): Promise<Referral> {
        const referral = await this.manager.getByReferee(refereeId);

        if (!referral)
            throw new NotFoundError('Referral not found.');

        return this.mapper.map(referral);
    }

    @Get('{id}/reward')
    @Security('admin', ['referral:reward:read'])
    public async getRewards(
        @Path() id: number,
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() order?: string,
        @Query() direction?: 'ASC' | 'DESC'): Promise<PagedResult<ReferralReward>> {
        const filter: ReferralRewardFilter = {
            page,
            pageSize
        };

        if (order && direction)
            filter.order = {
                [`${order}`]: direction
            };

        return this.manager.getRewards(id, filter);
    }

    @Get('{id}')
    @Security('admin', ['referral:read'])
    public async get(@Path() id: number): Promise<Referral> {
        const referral = await this.manager.get(id);

        if (!referral)
            throw new NotFoundError('Referral not found.');

        return this.mapper.map(referral);
    }
}
