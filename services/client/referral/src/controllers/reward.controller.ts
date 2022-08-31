import { Route, Security, Tags, ClientController, Get, Response, Query } from '@tcom/platform/lib/api';
import { PagedResult, UnauthorizedError } from '@tcom/platform/lib/core';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { ReferralUserManager, ReferralRewardFilter, ReferralRewardType } from '@tcom/platform/lib/referral';
import { ReferralRewardModel } from '../models';
import { ReferralRewardModelMapper } from '../models/mappers';

@Tags('Rewards')
@Route('referral/reward')
@LogClass()
export class RewardController extends ClientController {
    constructor(
        @Inject private readonly referralUserManager: ReferralUserManager,
        @Inject private readonly referralRewardMapper: ReferralRewardModelMapper) {
        super();
    }

    /**
     * @summary Gets the authenticated users rewards
     */
     @Get()
     @Response<UnauthorizedError>(401)
     @Security('cognito')
     public async getAll(
         @Query() type?: ReferralRewardType,
         @Query() direction: 'ASC' | 'DESC' = 'DESC',
         @Query() page: number = 1,
         @Query() pageSize: number = 20
     ): Promise<PagedResult<ReferralRewardModel>> {
         const filter: ReferralRewardFilter = {
             type,
             page,
             pageSize,
             order: {
                 createTime: direction
             }
         };

         const result = await this.referralUserManager.getRewards(this.user.id, filter);
         const models = await Promise.all(result.items.map(r => this.referralRewardMapper.map(r)));
         return new PagedResult(models, result.totalCount, result.page, result.pageSize);
     }
}
