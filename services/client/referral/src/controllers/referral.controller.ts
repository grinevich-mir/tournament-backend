import { Route, Security, Tags, ClientController, Get, Response, Path, Query } from '@tcom/platform/lib/api';
import { NotFoundError, PagedResult, UnauthorizedError } from '@tcom/platform/lib/core';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { ReferralFilter, ReferralManager, ReferralUser, ReferralUserManager, ReferralCommissionManager, ReferralCommissionRate } from '@tcom/platform/lib/referral';
import { PublicReferralUserModel, ReferralModel, ReferralUserModel } from '../models';
import { ReferralModelMapper, ReferralUserModelMapper } from '../models/mappers';

@Tags('Referrals')
@Route('referral')
@LogClass()
export class ReferralController extends ClientController {
    constructor(
        @Inject private readonly referralManager: ReferralManager,
        @Inject private readonly referralUserManager: ReferralUserManager,
        @Inject private readonly referralCommissionManager: ReferralCommissionManager,
        @Inject private readonly referralMapper: ReferralModelMapper,
        @Inject private readonly referralUserMapper: ReferralUserModelMapper) {
        super();
    }

    /**
     * @summary Gets the referral user for the authenticated user
     */
    @Get('user')
    @Response<UnauthorizedError>(401)
    @Security('cognito')
    public async getUser(): Promise<ReferralUserModel> {
        const referralUser = await this.referralUserManager.get(this.user.id);

        if (!referralUser)
            throw new NotFoundError('Referral user not found.');

        return this.referralUserMapper.map(referralUser);
    }

    /**
     * @summary Gets the authenticated users commission rates
     */
     @Get('commission')
     @Response<UnauthorizedError>(401)
     @Security('cognito')
     public async getCommissionRates(): Promise<ReferralCommissionRate[]> {
         const referralUser = await this.referralUserManager.get(this.user.id);

         if (!referralUser)
             throw new NotFoundError('Referral user not found.');

         return this.referralCommissionManager.getRates({
             groupId: referralUser.groupId,
             enabled: true
         });
     }

    /**
     * @summary Checks the supplied slug for availability and validity
     */
    /*@Put('slug/check')
    @Response<UnauthorizedError>(401)
    @Security('cognito')
    public async checkSlug(@Body() check: ReferralUserSlugCheckModel): Promise<ReferralUserSlugCheckResult> {
        return this.referralUserManager.validateSlug(check.slug, this.user.id);
    }*/

    /**
     * @summary Updates the referral user for the authenticated user
     */
    /*@Put('slug')
    @Response<UnauthorizedError>(401)
    @Security('cognito')
    public async setSlug(@Body() change: ReferralUserSlugChangeModel): Promise<void> {
        await this.referralUserManager.setSlug(this.user.id, change.slug);
    }*/

    /**
     * @summary Gets a referral users public data with its referral code
     */
    @Get('public/code/{code}')
    @Response<NotFoundError>(404, 'Referral user not found.')
    public async getPublicUserByCode(@Path() code: string): Promise<PublicReferralUserModel> {
        const referralUser = await this.referralUserManager.getByCode(code);
        return this.getPublicModel(referralUser);
    }

    /**
     * @summary Gets a referral users public data with its referral slug
     */
    @Get('public/slug/{slug}')
    @Response<NotFoundError>(404, 'Referral user not found.')
    public async getPublicUserBySlug(@Path() slug: string): Promise<PublicReferralUserModel> {
        const referralUser = await this.referralUserManager.getBySlug(slug);
        return this.getPublicModel(referralUser);
    }

    /**
     * @summary Gets the authenticated users referrals
     */
    @Get()
    @Response<UnauthorizedError>(401)
    @Security('cognito')
    public async getAll(
        @Query() order: 'created' | 'rewards' | 'revenue' = 'created',
        @Query() direction: 'ASC' | 'DESC' = 'DESC',
        @Query() page: number = 1,
        @Query() pageSize: number = 20
    ): Promise<PagedResult<ReferralModel>> {
        const filter: ReferralFilter = {
            page,
            pageSize
        };

        switch (order) {
            case 'created':
                filter.order = {
                    createTime: direction
                };
                break;

            case 'rewards':
                filter.order = {
                    rewardCount: direction,
                    createTime: direction
                };
                break;

            case 'revenue':
                filter.order = {
                    revenue: direction,
                    createTime: direction
                };
                break;
        }

        const result = await this.referralManager.getByReferrer(this.user.id, filter);
        const models = await Promise.all(result.items.map(r => this.referralMapper.map(r)));
        return new PagedResult(models, result.totalCount, result.page, result.pageSize);
    }

    private async getPublicModel(referralUser?: ReferralUser): Promise<PublicReferralUserModel> {
        if (!referralUser || !referralUser.active)
            throw new NotFoundError('Referral user not found.');

        return this.referralUserMapper.mapPublic(referralUser);
    }
}
