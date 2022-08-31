import { PaymentOption, PaymentOptionManager } from '@tcom/platform/lib/payment';
import { User, UserType } from '@tcom/platform/lib/user';
import { describe } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { deepEqual, instance, mock, mockUser, mockUserRequest, reset, when } from '@tcom/test/mock';
import { PaymentOptionController } from '../../src/controllers/payment-option.controller';

describe('PaymentOptionController', () => {
    const mockPaymentOptionManager = mock(PaymentOptionManager);

    function getController(): PaymentOptionController {
        return new PaymentOptionController(
            instance(mockPaymentOptionManager));
    }

    beforeEach(() => {
        reset(mockPaymentOptionManager);
    });

    describe('getAll()', () => {
        it('should return payment options using US country code as default', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const currencyCode = 'USD';

            const paymentOptions: PaymentOption[] = [];

            when(mockPaymentOptionManager.getAll(deepEqual({
                enabled: true,
                public: true,
                country: 'US',
                currency: currencyCode
            }))).thenResolve(paymentOptions);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    regCountry: undefined,
                    currencyCode
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll();

            // Then
            expect(result).to.equal(paymentOptions);
        });

        it('should return payment options using USD currency code as default', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const regCountry = 'US';

            const paymentOptions: PaymentOption[] = [];

            when(mockPaymentOptionManager.getAll(deepEqual({
                enabled: true,
                public: true,
                country: regCountry,
                currency: 'USD'
            }))).thenResolve(paymentOptions);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    regCountry,
                    currencyCode: undefined
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll();

            // Then
            expect(result).to.equal(paymentOptions);
        });

        it('should return payment options using user reg country and currency code', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const regCountry = 'US';
            const currencyCode = 'USD';

            const paymentOptions: PaymentOption[] = [];

            when(mockPaymentOptionManager.getAll(deepEqual({
                enabled: true,
                public: true,
                country: regCountry,
                currency: currencyCode
            }))).thenResolve(paymentOptions);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    regCountry,
                    currencyCode
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll();

            // Then
            expect(result).to.equal(paymentOptions);
        });

        it('should return non-public payment options when user is internal', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Internal;
            const regCountry = 'US';
            const currencyCode = 'USD';

            const paymentOptions: PaymentOption[] = [];

            when(mockPaymentOptionManager.getAll(deepEqual({
                enabled: true,
                public: undefined,
                country: regCountry,
                currency: currencyCode
            }))).thenResolve(paymentOptions);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType,
                    regCountry,
                    currencyCode
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.getAll();

            // Then
            expect(result).to.equal(paymentOptions);
        });
    });
});