import { NotFoundError } from '@tcom/platform/lib/core';
import { NewPaymentMethod, PaymentMethod, PaymentMethodCardType, PaymentMethodInitResult, PaymentMethodManager, PaymentMethodType, PaymentProvider } from '@tcom/platform/lib/payment';
import { PaymentMethodModel, PaymentMethodModelMapper } from '@tcom/platform/lib/payment/models';
import { User, UserManager, UserType } from '@tcom/platform/lib/user';
import { describe } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { deepEqual, instance, mock, mockUser, mockUserRequest, reset, verify, when } from '@tcom/test/mock';
import { PaymentMethodController } from '../../src/controllers/payment-method.controller';
import { PaymentMethodInitParamsModel, PaymentMethodRefreshParamsModel } from '../../src/models';

describe('PaymentMethodController', () => {
    const mockPaymentMethodManager = mock(PaymentMethodManager);
    const mockPaymentMethodMapper = mock(PaymentMethodModelMapper);
    const mockUserManager = mock(UserManager);

    function getController(): PaymentMethodController {
        return new PaymentMethodController(
            instance(mockPaymentMethodManager),
            instance(mockPaymentMethodMapper),
            instance(mockUserManager));
    }

    beforeEach(() => {
        reset(mockPaymentMethodManager);
        reset(mockUserManager);
        reset(mockPaymentMethodMapper);
    });

    describe('get()', () => {
        it('should throw a not found error if the user has no active payment methods', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            when(mockPaymentMethodManager.getActiveForUser(userId)).thenResolve(undefined);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.get();

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Payment method not found');
        });

        it('should return payment method', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                enabled: true,
                createTime: new Date(),
                expiryMonth: 1,
                expiryYear: 2020,
                lastFour: '1234',
                provider: PaymentProvider.Chargify,
                metadata: {},
                providerRef: '123123',
                updateTime: new Date(),
                userId
            };

            const paymentMethodModel: PaymentMethodModel = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                enabled: true,
                createTime: new Date(),
                expiryMonth: 1,
                expiryYear: 2020,
                lastFour: '1234',
                provider: PaymentProvider.Chargify,
                updateTime: new Date()
            };

            when(mockPaymentMethodManager.getActiveForUser(userId)).thenResolve(paymentMethod);
            when(mockPaymentMethodMapper.map(paymentMethod)).thenReturn(paymentMethodModel);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.get();

            // Then
            expect(result).to.exist;
            expect(result).to.equal(paymentMethodModel);
        });
    });

    describe('add()', () => {
        it('should add payment method', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const provider = PaymentProvider.Chargify;

            const newPaymentMethod: NewPaymentMethod = {
                firstName: 'FirstName',
                lastName: 'LastName',
                token: '12345ABC'
            };

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                enabled: true,
                createTime: new Date(),
                expiryMonth: 1,
                expiryYear: 2020,
                lastFour: '1234',
                provider: PaymentProvider.Chargify,
                metadata: {},
                providerRef: '123123',
                updateTime: new Date(),
                userId
            };

            const paymentMethodModel: PaymentMethodModel = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                enabled: true,
                createTime: new Date(),
                expiryMonth: 1,
                expiryYear: 2020,
                lastFour: '1234',
                provider: PaymentProvider.Chargify,
                updateTime: new Date()
            };

            when(mockPaymentMethodManager.create(userId, provider, newPaymentMethod)).thenResolve(paymentMethod);
            when(mockPaymentMethodMapper.map(paymentMethod)).thenReturn(paymentMethodModel);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.add(newPaymentMethod);

            // Then
            expect(result).to.equal(paymentMethodModel);
            verify(mockUserManager.setProfile(userId, deepEqual({
                forename: newPaymentMethod.firstName,
                surname: newPaymentMethod.lastName
            })));
        });
    });

    describe('init()', () => {
        it('should init payment method', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const provider = PaymentProvider.Trustly;

            const params: PaymentMethodInitParamsModel = {
                provider,
                returnUrl: 'https://google.co.uk'
            };

            const expectedResult: PaymentMethodInitResult = {
                provider,
                data: {}
            };

            when(mockPaymentMethodManager.init(userId, provider, params.returnUrl)).thenResolve(expectedResult);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.init(params);

            // Then
            expect(result).to.equal(expectedResult);
        });
    });

    describe('refresh()', () => {
        it('should get payment method refresh data', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const provider = PaymentProvider.Trustly;
            const paymentMethodId = 1;

            const params: PaymentMethodRefreshParamsModel = {
                returnUrl: 'https://google.co.uk'
            };

            const expectedResult: PaymentMethodInitResult = {
                provider,
                data: {}
            };

            when(mockPaymentMethodManager.refresh(userId, paymentMethodId, params.returnUrl)).thenResolve(expectedResult);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user: mockUser({
                    id: userId,
                    secureId: userSecureId,
                    skinId,
                    type: userType
                })
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.refresh(paymentMethodId, params);

            // Then
            expect(result).to.equal(expectedResult);
        });
    });
});