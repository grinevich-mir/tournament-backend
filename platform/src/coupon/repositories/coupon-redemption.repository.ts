import { CouponRedemption, CouponRedemptionFilter, NewCouponRedemption } from '..';
import { PagedResult } from '../../core';
import { GlobalDB } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { CouponRedemptionEntity } from '../entities';
import { CouponRedemptionEntityMapper } from '../entities/mappers';

@Singleton
@LogClass()
export class CouponRedemptionRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: CouponRedemptionEntityMapper) {
    }

    public async getAll(filter?: CouponRedemptionFilter): Promise<PagedResult<CouponRedemption>> {
        const connection = await this.db.getConnection();
        let query = connection.createQueryBuilder(CouponRedemptionEntity, 'couponRedepemtion');

        if (filter) {
            if (filter.couponId)
                query = query.andWhere('couponId = :couponId', { couponId: filter.couponId });
            if (filter.page && filter.pageSize)
                query = query
                    .skip((filter.page - 1) * filter.pageSize)
                    .take(filter.pageSize);
        }

        const [entities, count] = await query.getManyAndCount();
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        const redemptions = entities.map(e => this.mapper.fromEntity(e));
        return new PagedResult(redemptions, count, page, pageSize);
    }

    public async get(id: number): Promise<CouponRedemption | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(CouponRedemptionEntity, id);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async count(id: number, userId: number): Promise<number> {
        const connection = await this.db.getConnection();
        return connection.manager.count(CouponRedemptionEntity, {
            id,
            userId
        });
    }

    public async add(redemption: NewCouponRedemption): Promise<CouponRedemption> {
        const connection = await this.db.getConnection();
        let entity = this.mapper.newToEntity(redemption);
        entity = await connection.manager.save(entity);
        return await this.get(entity.id) as CouponRedemption;
    }

    public async update(redemption: CouponRedemption): Promise<CouponRedemption> {
        const connection = await this.db.getConnection();
        let entity = this.mapper.toEntity(redemption);
        entity = await connection.manager.save(entity);
        return await this.get(entity.id) as CouponRedemption;
    }
}