import { NewCouponRedemption, CouponRedemption } from '../../coupon-redemption';
import { CouponRedemptionEntity } from '..';
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';

@Singleton
@LogClass()
export class CouponRedemptionEntityMapper {
    public fromEntity(source: CouponRedemptionEntity): CouponRedemption {
        return {
            id: source.id,
            couponId: source.couponId,
            userId: source.userId,
            orderId: source.orderId,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public toEntity(source: CouponRedemption): CouponRedemptionEntity {
        const entity = new CouponRedemptionEntity();
        entity.id = source.id;
        entity.couponId = source.couponId;
        entity.userId = source.userId;
        entity.orderId = source.orderId;
        entity.createTime = source.createTime;
        entity.updateTime = source.updateTime;
        return entity;
    }

    public newToEntity(source: NewCouponRedemption): CouponRedemptionEntity {
        const entity = new CouponRedemptionEntity();
        entity.couponId = source.couponId;
        entity.userId = source.userId;
        entity.orderId = source.orderId;
        return entity;
    }
}