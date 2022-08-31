import { Response, Route, Security, SuccessResponse, Tags, ClientController, Get, Path } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NotFoundError, UnauthorizedError } from '@tcom/platform/lib/core/errors';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { Coupon, CouponManager } from '@tcom/platform/lib/coupon';

@Tags('Coupon')
@Route('coupon')
@Security('cognito')
@LogClass()
export class CouponController extends ClientController {
    constructor(
        @Inject private readonly couponManager: CouponManager) {
        super();
    }

    @Get('{code}')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    public async get(@Path() code: string): Promise<Coupon> {
        const coupon = await this.couponManager.getActive(code, this.user.id);

        if (!coupon)
            throw new NotFoundError('Coupon not found.');

        return coupon;
    }
}
