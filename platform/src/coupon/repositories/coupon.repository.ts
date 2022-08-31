import { Raw } from 'typeorm';
import { Coupon, CouponFilter, CouponUpdate, NewCoupon } from '..';
import { PagedResult } from '../../core';
import { GlobalDB } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { CouponEntity } from '../entities';
import { CouponEntityMapper } from '../entities/mappers';
import { CouponRedemptionRepository } from './coupon-redemption.repository';

@Singleton
@LogClass()
export class CouponRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly couponRedemptionRepository: CouponRedemptionRepository,
        @Inject private readonly mapper: CouponEntityMapper) {
    }

    public async getAll(filter?: CouponFilter): Promise<PagedResult<Coupon>> {
        const connection = await this.db.getConnection();
        let query = connection.createQueryBuilder(CouponEntity, 'coupon');

        if (filter)
            if (filter.page && filter.pageSize)
                query = query
                    .skip((filter.page - 1) * filter.pageSize)
                    .take(filter.pageSize);

        const [entities, count] = await query.getManyAndCount();
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        const coupons = entities.map(e => this.mapper.fromEntity(e));
        return new PagedResult(coupons, count, page, pageSize);
    }

    public async get(id: number): Promise<Coupon | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(CouponEntity, id);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async getActive(code: string, userId?: number): Promise<Coupon | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(CouponEntity, {
            code,
            validFrom: Raw(alias => `${alias} <= NOW()`),
            validTo: Raw(alias => `(${alias} >= NOW() OR ${alias} IS NULL)`)
        });

        if (!entity)
            return undefined;

        if (entity.restrictions?.maxRedemptionsPerCoupon && entity.redemptionCount >= entity.restrictions?.maxRedemptionsPerCoupon)
            return undefined;

        if (userId && entity.restrictions?.maxRedemptionsPerUser) {
            const redemptions = await this.couponRedemptionRepository.count(entity.id, userId);
            if (redemptions >= entity.restrictions?.maxRedemptionsPerUser)
                return undefined;
        }

        return this.mapper.fromEntity(entity);
    }

    public async add(coupon: NewCoupon): Promise<Coupon> {
        const connection = await this.db.getConnection();
        let entity = this.mapper.newToEntity(coupon);
        entity = await connection.manager.save(entity);
        return await this.get(entity.id) as Coupon;
    }

    public async update(id: number, coupon: CouponUpdate): Promise<Coupon> {
        const connection = await this.db.getConnection();
        const entity = this.mapper.updateToEntity(id, coupon);
        await connection.manager.save(entity);
        return await this.get(id) as Coupon;
    }
}