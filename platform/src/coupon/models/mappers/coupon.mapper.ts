import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { Coupon } from '../../coupon';
import { CouponModel } from '../coupon.model';

@Singleton
@LogClass()
export class CouponModelMapper {
    public map(source: Coupon): CouponModel {
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
            updateTime: source.updateTime,
        };
    }
}