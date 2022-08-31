import { PagedResult } from '@tcom/platform/lib/core';
import { Payment, PaymentFilter, PaymentManager, PaymentMethodCardType, PaymentMethodType, PaymentProvider, PaymentStatus, PaymentType } from '@tcom/platform/lib/payment';
import { User, UserType } from '@tcom/platform/lib/user';
import { describe } from '@tcom/test';
import { expect } from '@tcom/test/assert';
import { deepEqual, instance, mock, mockUser, mockUserRequest, reset, when } from '@tcom/test/mock';
import { PaymentController } from '../../src/controllers/payment.controller';
import { PaymentModel, PaymentModelMapper } from '@tcom/platform/lib/payment/models';

describe('PaymentController', () => {
    const mockPaymentManager = mock(PaymentManager);
    const mockModelMapper = mock(PaymentModelMapper);

    function getController(): PaymentController {
        return new PaymentController(
            instance(mockPaymentManager),
            instance(mockModelMapper));
    }

    beforeEach(() => {
        reset(mockPaymentManager);
        reset(mockModelMapper);
    });

    describe('getAll()', async () => {
        it('should return an empty result when there are no payments', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const page = 1;
            const pageSize = 20;

            const filter: PaymentFilter = {
                userId,
                page,
                pageSize,
                order: {
                    createTime: 'DESC'
                }
            };

            const payments: Payment[] = [];

            when(mockPaymentManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(payments, 0, page, pageSize));

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
            const result = await controller.getAll();

            // Then
            expect(result.items).to.be.empty;
        });

        it('should return subscription payments', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;
            const page = 1;
            const pageSize = 20;

            const filter: PaymentFilter = {
                userId,
                page,
                pageSize,
                order: {
                    createTime: 'DESC'
                }
            };

            const payments: Payment[] = [{
                id: 1,
                amount: 10,
                userId,
                currencyCode: 'USD',
                paymentMethodId: 1,
                paymentMethod: {
                    id: 1,
                    type: PaymentMethodType.CreditCard,
                    cardType: PaymentMethodCardType.Visa,
                    enabled: true,
                    createTime: new Date(),
                    expiryMonth: 1,
                    expiryYear: 2020,
                    lastFour: '1234',
                    provider: PaymentProvider.Chargify,
                    providerRef: '123123',
                    updateTime: new Date(),
                    userId
                },
                provider: PaymentProvider.Chargify,
                providerRef: 'ABC12345',
                status: PaymentStatus.Successful,
                type: PaymentType.Purchase,
                createTime: new Date(),
                updateTime: new Date()
            }];

            const paymentModel: PaymentModel = {
                id: 1,
                amount: 10,
                createTime: new Date(),
                currencyCode: 'USD',
                paymentMethod: {
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
                },
                status: PaymentStatus.Successful,
                type: PaymentType.Purchase,
            };

            when(mockPaymentManager.getAll(deepEqual(filter))).thenResolve(new PagedResult(payments, 1, page, pageSize));
            when(mockModelMapper.map(payments[0])).thenReturn(paymentModel);

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
            const result = await controller.getAll();

            // Then
            expect(result.items[0]).to.equal(paymentModel);
        });
    });
});