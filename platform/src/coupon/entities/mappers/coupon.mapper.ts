import { Coupon, NewCoupon, CouponUpdate } from '../../coupon';
import { CouponEntity } from '..';
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';

@Singleton
@LogClass()
export class CouponEntityMapper {
    public fromEntity(source: CouponEntity): Coupon {
        return {
            id: source.id,
            name: source.name,
            validFrom: source.validFrom,
            validTo: source.validTo,
            code: source.code,
            amountOff: source.amountOff,
            percentOff: source.percentOff,
            bonusItems: source.bonusItems,
            restrictions: source.restrictions,
            redemptionCount: source.redemptionCount,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public toEntity(source: Coupon): CouponEntity {
        const entity = new CouponEntity();
        entity.id = source.id;
        entity.name = source.name;
        entity.validFrom = source.validFrom;
        entity.validTo = source.validTo;
        entity.code = source.code;
        entity.amountOff = source.amountOff;
        entity.percentOff = source.percentOff;
        entity.bonusItems = source.bonusItems;
        entity.restrictions = source.restrictions;
        entity.redemptionCount = source.redemptionCount;
        entity.createTime = source.createTime;
        entity.updateTime = source.updateTime;
        return entity;
    }

    public newToEntity(source: NewCoupon): CouponEntity {
        const entity = new CouponEntity();
        entity.name = source.name;
        entity.validFrom = source.validFrom;
        entity.validTo = source.validTo;
        entity.code = source.code;
        entity.amountOff = source.amountOff;
        entity.percentOff = source.percentOff;
        entity.bonusItems = source.bonusItems;
        entity.restrictions = source.restrictions;
        return entity;
    }

    public updateToEntity(id: number, source: CouponUpdate): CouponEntity {
        const entity = new CouponEntity();
        entity.id = id;
        entity.name = source.name;
        entity.validFrom = source.validFrom;
        entity.validTo = source.validTo;
        entity.code = source.code;
        entity.amountOff = source.amountOff;
        entity.percentOff = source.percentOff;
        entity.bonusItems = source.bonusItems;
        entity.restrictions = source.restrictions;
        return entity;
    }
}