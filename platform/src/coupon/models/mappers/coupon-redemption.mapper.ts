import { CouponRedemption } from '../../coupon-redemption';
import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { CouponRedemptionModel } from '../coupon-redemption.model';

@Singleton
@LogClass()
export class CouponRedemptionModelMapper {
    public map(source: CouponRedemption): CouponRedemptionModel {
        return {
            id: source.id,
            couponId: source.couponId,
            userId: source.userId,
            orderId: source.orderId,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}