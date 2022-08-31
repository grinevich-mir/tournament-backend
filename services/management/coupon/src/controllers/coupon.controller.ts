import { AdminController, Route, Tags, Query, Get, Security, Path, Post, Put, Body } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { Coupon, CouponFilter, CouponManager, CouponUpdate, NewCoupon } from '@tcom/platform/lib/coupon';

@Tags('Coupons')
@Route('coupon')
@LogClass()
export class CouponController extends AdminController {
    constructor(
        @Inject private manager: CouponManager) {
        super();
    }

    /**
     * @summary Gets all coupons
     */
    @Get()
    @Security('admin', ['coupon:read'])
    public async getAll(
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<Coupon>> {
        const filter: CouponFilter = {
            page,
            pageSize,
            order: {
                createTime: 'DESC'
            }
        };

        return this.manager.getAll(filter);
    }

    /**
     * @summary Gets a coupon
     * @param id A coupon ID
     */
    @Get('/{id}')
    @Security('admin', ['coupon:read'])
    public async get(@Path() id: number): Promise<Coupon> {
        const coupon = await this.manager.get(id);

        if (!coupon)
            throw new NotFoundError('Coupon not found');

        return coupon;
    }

    /**
     * @summary Create a coupon
     */
    @Post()
    @Security('admin', ['coupon:write'])
    public async create(@Body() newCoupon: NewCoupon): Promise<Coupon> {
        return this.manager.add(newCoupon);
    }

    /**
     * @summary Update a coupon
     */
    @Put('/{id}')
    @Security('admin', ['coupon:write'])
    public async update(@Path() id: number, @Body() coupon: CouponUpdate): Promise<Coupon> {
        return this.manager.update(id, coupon);
    }
}
