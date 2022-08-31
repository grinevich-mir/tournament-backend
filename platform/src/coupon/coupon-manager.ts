import { CouponFilter } from '.';
import { PagedResult } from '../core';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { Coupon, CouponUpdate, NewCoupon } from './coupon';
import { CouponRepository } from './repositories';

@Singleton
@LogClass()
export class CouponManager {
    constructor(
        @Inject private readonly repository: CouponRepository
    ) {
    }

    public async getAll(filter?: CouponFilter): Promise<PagedResult<Coupon>> {
        return this.repository.getAll(filter);
    }

    public async get(id: number): Promise<Coupon | undefined> {
        return this.repository.get(id);
    }

    public async getActive(code: string, userId?: number): Promise<Coupon | undefined> {
        return this.repository.getActive(code, userId);
    }

    public async add(coupon: NewCoupon): Promise<Coupon> {
        return this.repository.add(coupon);
    }

    public async update(id: number, coupon: CouponUpdate): Promise<Coupon> {
        return this.repository.update(id, coupon);
    }
}