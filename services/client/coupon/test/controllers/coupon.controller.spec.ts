import { describe } from '@tcom/test';
import { mock, instance, reset, when, mockUserRequest, mockUser } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { Coupon, CouponManager } from '@tcom/platform/lib/coupon';
import { CouponController } from '../../src/controllers/coupon.controller';
import { User, UserType } from '@tcom/platform/lib/user';

describe('CouponController', () => {
    const mockManager = mock(CouponManager);

    function getController(): CouponController {
        return new CouponController(
            instance(mockManager));
    }

    beforeEach(() => {
        reset(mockManager);
    });

    describe('get(code)', () => {
        it('should return a coupon code', async () => {
            const coupon: Coupon = {
                id: 1,
                name: 'test',
                validFrom: new Date(),
                code: 'test',
                amountOff: 10,
                redemptionCount: 0,
                createTime: new Date(),
                updateTime: new Date(),
            };

            const controller = getController();

            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            when(mockManager.getActive('test', 1)).thenResolve(coupon);

            // When
            const result = await controller.get('test');

            // Then
            expect(result).to.exist;
            expect(result).to.deep.equal({
                id: 1,
                name: 'test',
                validFrom: coupon.validFrom,
                code: 'test',
                amountOff: 10,
                redemptionCount: 0,
                createTime: coupon.createTime,
                updateTime: coupon.updateTime,
            });
        });
    });

    it('should return no coupon', async () => {
        const controller = getController();

        const userId = 1;
        const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
        const skinId = 'tournament';
        const userType = UserType.Standard;
        const mockRequest = mockUserRequest<User>({
            user: mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            })
        });
        controller.setRequest(instance(mockRequest));

        // Then
        expect(controller.get('unknown')).to.be.rejected;
    });
});