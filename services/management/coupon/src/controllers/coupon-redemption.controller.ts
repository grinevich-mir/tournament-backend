import { AdminController, Route, Tags, Query, Get, Security, Path, Post, Body } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { CouponRedemption, CouponRedemptionFilter, CouponRedemptionManager, NewCouponRedemption } from '@tcom/platform/lib/coupon';

@Tags('Coupons')
@Route('coupon/redemption')
@LogClass()
export class CouponRedemptionController extends AdminController {
    constructor(
        @Inject private manager: CouponRedemptionManager) {
        super();
    }

    /**
     * @summary Gets all coupon redemptions
     */
    @Get()
    @Security('admin', ['coupon:read'])
    public async getAll(
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() couponId?: number,
    ): Promise<PagedResult<CouponRedemption>> {
        const filter: CouponRedemptionFilter = {
            couponId,
            page,
            pageSize,
            order: {
                createTime: 'DESC'
            }
        };

        return this.manager.getAll(filter);
    }

    /**
     * @summary Gets a coupon redemption
     * @param id A coupon redemption ID
     */
    @Get('/{id}')
    @Security('admin', ['coupon:read'])
    public async get(@Path() id: number): Promise<CouponRedemption> {
        const redemption = await this.manager.get(id);

        if (!redemption)
            throw new NotFoundError('Coupon redemption not found');

        return redemption;
    }

    /**
     * @summary Create a coupon redemption
     */
    @Post()
    @Security('admin', ['coupon:write'])
    public async create(@Body() newRedemption: NewCouponRedemption): Promise<CouponRedemption> {
        return this.manager.add(newRedemption);
    }

    /**
     * @summary Update a coupon redemption
     * @param id A coupon redemption ID
     */
    @Post('/{id}')
    @Security('admin', ['coupon:write'])
    public async update(@Body() redemption: CouponRedemption): Promise<CouponRedemption> {
        return this.manager.update(redemption);
    }
}
