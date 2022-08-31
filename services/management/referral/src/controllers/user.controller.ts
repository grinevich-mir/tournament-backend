import { AdminController, Route, Tags, Security, Get, Path, Body, Put, Query } from '@tcom/platform/lib/api';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { ReferralUserManager, ReferralUser, ReferralRewardFilter, ReferralReward } from '@tcom/platform/lib/referral';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { ReferralUserChangeSlugModel, ReferralUserGroupChangeModel } from '../models';

@Tags('Users')
@Route('referral/user')
@Security('admin')
@LogClass()
export class UserController extends AdminController {
    constructor(@Inject private readonly manager: ReferralUserManager) {
        super();
    }

    @Get('{id}')
    @Security('admin', ['referral:user:read'])
    public async get(@Path() id: number): Promise<ReferralUser> {
        const user = await this.manager.get(id);

        if (!user)
            throw new NotFoundError('Referral user not found.');

        return user;
    }

    @Put('{id}/slug')
    @Security('admin', ['referral:user:write'])
    public async setSlug(@Path() id: number, @Body() model: ReferralUserChangeSlugModel): Promise<void> {
        await this.manager.setSlug(id, model.slug);
    }

    @Put('{id}/activate')
    @Security('admin', ['referral:user:write'])
    public async activate(@Path() id: number): Promise<void> {
        await this.manager.activate(id);
    }

    @Put('{id}/deactivate')
    @Security('admin', ['referral:user:write'])
    public async deactivate(@Path() id: number): Promise<void> {
        await this.manager.deactivate(id);
    }

    @Put('{id}/group')
    @Security('admin', ['referral:user:write'])
    public async setGroup(@Path() id: number, @Body() model: ReferralUserGroupChangeModel): Promise<void> {
        await this.manager.setGroupId(id, model.groupId);
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
}
