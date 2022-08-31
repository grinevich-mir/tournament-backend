import { CouponRedemptionFilter } from '.';
import { PagedResult } from '../core';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { CouponRedemption, NewCouponRedemption } from './coupon-redemption';
import { CouponRedemptionRepository } from './repositories';

@Singleton
@LogClass()
export class CouponRedemptionManager {
    constructor(
        @Inject private readonly repository: CouponRedemptionRepository
    ) {
    }

    public async getAll(filter?: CouponRedemptionFilter): Promise<PagedResult<CouponRedemption>> {
        return this.repository.getAll(filter);
    }

    public async get(id: number): Promise<CouponRedemption | undefined> {
        return this.repository.get(id);
    }

    public async add(coupon: NewCouponRedemption): Promise<CouponRedemption> {
        return this.repository.add(coupon);
    }

    public async update(coupon: CouponRedemption): Promise<CouponRedemption> {
        return this.repository.update(coupon);
    }
}