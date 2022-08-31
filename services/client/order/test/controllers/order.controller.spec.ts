import { describe, it } from '@tcom/test';
import { mock, instance, mockUserRequest, reset, mockUser, when, verify, deepEqual } from '@tcom/test/mock';
import { expect } from '@tcom/test/assert';
import { OrderController } from '../../src/controllers/order.controller';
import { User, UserType } from '@tcom/platform/lib/user';
import { Order, OrderFilter, OrderManager, OrderStatus } from '@tcom/platform/lib/order';
import { PaymentActionType, PaymentMethod, PaymentMethodCardType, PaymentMethodManager, PaymentMethodType, PaymentResult, PaymentStatus, Payment, PaymentType } from '@tcom/platform/lib/payment';
import { PaymentGateway, PaymentGatewayFactory } from '@tcom/platform/lib/payment/providers';
import { OrderCheckoutParamsModel, OrderPaymentOptionsModel, OrderPaymentModel, OrderPaymentCompleteModel } from '../../src/models';
import { OrderPaymentCompleteModelMapper } from '../../src/models/mappers';
import { PaymentProvider } from '@tcom/platform/lib/payment';
import { ForbiddenError, NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { PaymentInitResult } from '@tcom/platform/lib/payment/payment-init-result';
import { OrderModel, OrderModelMapper } from '@tcom/platform/lib/order/models';
import { v4 as uuid } from 'uuid';

describe('OrderController', () => {
    const mockOrderManager = mock(OrderManager);
    const mockPaymentMethodManager = mock(PaymentMethodManager);
    const mockPaymentGatewayFactory = mock(PaymentGatewayFactory);
    const mockOrderMapper = mock(OrderModelMapper);
    const mockOrderPaymentMapper = mock(OrderPaymentCompleteModelMapper);

    function getController(): OrderController {
        return new OrderController(
            instance(mockOrderManager),
            instance(mockPaymentMethodManager),
            instance(mockPaymentGatewayFactory),
            instance(mockOrderMapper),
            instance(mockOrderPaymentMapper));
    }

    beforeEach(() => {
        reset(mockOrderManager);
        reset(mockPaymentMethodManager);
        reset(mockPaymentGatewayFactory);
        reset(mockOrderMapper);
        reset(mockOrderPaymentMapper);
    });

    describe('getAll()', () => {
        it('should return a list of orders', async () => {
            // Given
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const page = 1;
            const pageSize = 20;

            const filter: OrderFilter = {
                userId,
                statuses: [OrderStatus.Paid, OrderStatus.Complete],
                page,
                pageSize,
                order: {
                    createTime: 'DESC'
                }
            };

            const ordersResult = new PagedResult<Order>([], 1, page, pageSize);
            const models: OrderModel[] = [];

            when(mockOrderManager.getAll(deepEqual(filter))).thenResolve(ordersResult);
            when(mockOrderMapper.mapAll(ordersResult.items)).thenReturn(models);

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
            expect(result).to.be.of.instanceOf(PagedResult);
            expect(result.items).to.equal(models);
        });
    });

    describe('get()', () => {
        it('should throw a not found error if order does not exist', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            when(mockOrderManager.get(orderId)).thenResolve(undefined);

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
            const delegate = async () => controller.get(orderId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Order not found');
        });

        it('should throw a not found error if order does not belong to the current user', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId: 2,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);

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
            const delegate = async () => controller.get(orderId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Order not found');
        });

        it('should return the order', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId: 1,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const model: OrderModel = {
                id: orderId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);
            when(mockOrderMapper.map(order)).thenReturn(model);

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
            const result = await controller.get(orderId);

            // Then
            expect(result).to.equal(model);
        });
    });

    describe('checkout()', () => {
        it('should throw a not found error if order does not exist', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderCheckoutParamsModel = {
                orderId,
                provider: PaymentProvider.Unipaas,
                returnUrl: 'https://example.com'
            };

            when(mockOrderManager.get(orderId)).thenResolve(undefined);

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
            const delegate = async () => controller.checkout(params);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Order not found');
        });

        it('should throw a not found error if order does not belong to the current user', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderCheckoutParamsModel = {
                orderId,
                provider: PaymentProvider.Unipaas,
                returnUrl: 'https://example.com'
            };

            const order: Order = {
                id: orderId,
                userId: 2,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);

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
            const delegate = async () => controller.checkout(params);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Order not found');
        });

        it('should throw a forbidden error if order is not pending', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderCheckoutParamsModel = {
                orderId,
                provider: PaymentProvider.Unipaas,
                returnUrl: 'https://example.com'
            };

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Complete,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);

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
            const delegate = async () => controller.checkout(params);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'Order is invalid');
        });

        it('should return checkout URL', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderCheckoutParamsModel = {
                orderId,
                provider: PaymentProvider.Unipaas,
                returnUrl: 'https://example.com',
                cancelUrl: 'https://example.com?action=cancel'
            };

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const checkoutUrl = 'https://example.com/checkout';

            const gateway = mock<PaymentGateway>();
            when(gateway.getCheckoutUrl(user, order.priceTotal, order.currencyCode, order.description, order.id.toString(), params.returnUrl, params.cancelUrl)).thenResolve(checkoutUrl);

            when(mockPaymentGatewayFactory.create(params.provider)).thenReturn(instance(gateway));
            when(mockOrderManager.get(orderId)).thenResolve(order);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.checkout(params);

            // Then
            expect(result).to.exist;
            expect(result.checkoutUrl).to.equal(checkoutUrl);
        });
    });

    describe('takePayment()', () => {
        it('should throw a not found error if order does not exist', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            when(mockOrderManager.get(orderId)).thenResolve(undefined);

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
            const delegate = async () => controller.takePayment(orderId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Order not found');
        });

        it('should throw a not found error if order does not belong to the current user', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId: 2,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);

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
            const delegate = async () => controller.takePayment(orderId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Order not found');
        });

        it('should throw a forbidden error if order is not pending', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Complete,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);

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
            const delegate = async () => controller.takePayment(orderId);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'Order is invalid');
        });

        it('should throw a forbidden error if the user does not have an active payment method', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);
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
            const delegate = async () => controller.takePayment(orderId);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'User does not have an active payment method');
        });

        it('should take payment and not set order to paid if not successful status without options', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const paymentAmount = 10;

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                expiryMonth: 12,
                expiryYear: 2024,
                provider: PaymentProvider.Unipaas,
                lastFour: '1234',
                providerRef: 'abc12345',
                userId,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const paymentResult: PaymentResult = {
                provider: PaymentProvider.Unipaas,
                status: PaymentStatus.Pending,
                action: {
                    type: PaymentActionType.Redirect,
                    url: 'https://www.blah.com',
                    popup: false
                }
            };

            const options: OrderPaymentOptionsModel | undefined = undefined;

            when(mockPaymentMethodManager.getActiveForUser(userId)).thenResolve(paymentMethod);

            const mockGateway = mock<PaymentGateway>();
            when(mockGateway.takePayment(user, paymentMethod, paymentAmount, order.currencyCode, order.id.toString(), order.description, undefined)).thenResolve(paymentResult);
            when(mockPaymentGatewayFactory.create(paymentMethod.provider)).thenReturn(instance(mockGateway));
            when(mockOrderManager.get(orderId)).thenResolve(order);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.takePayment(orderId, options);

            // Then
            expect(result).to.equal(paymentResult);
            verify(mockOrderManager.setStatus(orderId, OrderStatus.Paid)).never();
        });

        it('should take payment and not set order to paid if not successful status with options', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const paymentAmount = 10;

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                expiryMonth: 12,
                expiryYear: 2024,
                provider: PaymentProvider.Unipaas,
                lastFour: '1234',
                providerRef: 'abc12345',
                userId,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const paymentResult: PaymentResult = {
                provider: PaymentProvider.Unipaas,
                status: PaymentStatus.Pending,
                action: {
                    type: PaymentActionType.Redirect,
                    url: 'https://www.blah.com',
                    popup: false
                }
            };

            const options: OrderPaymentOptionsModel = {
                redirectUrl: 'https://www.redirect.com'
            };

            when(mockPaymentMethodManager.getActiveForUser(userId)).thenResolve(paymentMethod);

            const mockGateway = mock<PaymentGateway>();
            when(mockGateway.takePayment(user, paymentMethod, paymentAmount, order.currencyCode, order.id.toString(), order.description, options?.redirectUrl)).thenResolve(paymentResult);
            when(mockPaymentGatewayFactory.create(paymentMethod.provider)).thenReturn(instance(mockGateway));
            when(mockOrderManager.get(orderId)).thenResolve(order);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.takePayment(orderId, options);

            // Then
            expect(result).to.equal(paymentResult);
            verify(mockOrderManager.setStatus(orderId, OrderStatus.Paid)).never();
        });

        it('should take payment and set order to paid if successful status without options', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const paymentAmount = 10;

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                expiryMonth: 12,
                expiryYear: 2024,
                provider: PaymentProvider.Unipaas,
                lastFour: '1234',
                providerRef: 'abc12345',
                userId,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const paymentResult: PaymentResult = {
                provider: PaymentProvider.Unipaas,
                status: PaymentStatus.Successful
            };

            const options: OrderPaymentOptionsModel | undefined = undefined;

            when(mockPaymentMethodManager.getActiveForUser(userId)).thenResolve(paymentMethod);

            const mockGateway = mock<PaymentGateway>();
            when(mockGateway.takePayment(user, paymentMethod, paymentAmount, order.currencyCode, order.id.toString(), order.description, undefined)).thenResolve(paymentResult);
            when(mockPaymentGatewayFactory.create(paymentMethod.provider)).thenReturn(instance(mockGateway));
            when(mockOrderManager.get(orderId)).thenResolve(order);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.takePayment(orderId, options);

            // Then
            expect(result).to.equal(paymentResult);
            verify(mockOrderManager.setStatus(orderId, OrderStatus.Paid)).once();
        });

        it('should take payment and set order to paid if successful status with options', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const paymentAmount = 10;

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                expiryMonth: 12,
                expiryYear: 2024,
                provider: PaymentProvider.Unipaas,
                lastFour: '1234',
                providerRef: 'abc12345',
                userId,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const paymentResult: PaymentResult = {
                provider: PaymentProvider.Unipaas,
                status: PaymentStatus.Successful
            };

            const options: OrderPaymentOptionsModel = {
                redirectUrl: 'https://www.redirect.com'
            };

            when(mockPaymentMethodManager.getActiveForUser(userId)).thenResolve(paymentMethod);

            const mockGateway = mock<PaymentGateway>();
            when(mockGateway.takePayment(user, paymentMethod, paymentAmount, order.currencyCode, order.id.toString(), order.description, options?.redirectUrl)).thenResolve(paymentResult);
            when(mockPaymentGatewayFactory.create(paymentMethod.provider)).thenReturn(instance(mockGateway));
            when(mockOrderManager.get(orderId)).thenResolve(order);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.takePayment(orderId, options);

            // Then
            expect(result).to.equal(paymentResult);
            verify(mockOrderManager.setStatus(orderId, OrderStatus.Paid)).once();
        });
    });

    describe('initPayment()', () => {
        it('should throw a not found error if order does not exist', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            when(mockOrderManager.get(orderId)).thenResolve(undefined);

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
            const delegate = async () => controller.initPayment(orderId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Order not found');
        });

        it('should throw a not found error if order does not belong to the current user', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId: 2,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);

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
            const delegate = async () => controller.initPayment(orderId);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Order not found');
        });

        it('should throw a forbidden error if order is not pending', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Complete,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);

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
            const delegate = async () => controller.initPayment(orderId);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'Order is invalid');
        });

        it('should throw a forbidden error if the user does not have an active payment method', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);
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
            const delegate = async () => controller.initPayment(orderId);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'User does not have an active payment method');
        });

        it('should take payment and set order to paid if payments equal or exceed total', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const paymentAmount = 10;

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                expiryMonth: 12,
                expiryYear: 2024,
                provider: PaymentProvider.Unipaas,
                lastFour: '1234',
                providerRef: 'abc12345',
                userId,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const initResult: PaymentInitResult = {
                provider: PaymentProvider.Unipaas,
                data: {}
            };

            when(mockPaymentMethodManager.getActiveForUser(userId)).thenResolve(paymentMethod);

            const mockGateway = mock<PaymentGateway>();
            when(mockGateway.initPayment(user, paymentMethod, paymentAmount, order.currencyCode, order.description, order.id.toString())).thenResolve(initResult);
            when(mockPaymentGatewayFactory.create(paymentMethod.provider)).thenReturn(instance(mockGateway));
            when(mockOrderManager.get(orderId)).thenResolve(order);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.initPayment(orderId);

            // Then
            expect(result).to.equal(initResult);
        });
    });

    describe('completePayment()', () => {
        it('should throw a not found error if order does not exist', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderPaymentModel = {
                provider: PaymentProvider.PayPal,
                data: {
                    token: uuid()
                }
            };

            when(mockOrderManager.get(orderId)).thenResolve(undefined);

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
            const delegate = async () => controller.completePayment(orderId, params);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Order not found');
        });

        it('should throw a not found error if order does not belong to the current user', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderPaymentModel = {
                provider: PaymentProvider.PayPal,
                data: {
                    token: uuid()
                }
            };

            const order: Order = {
                id: orderId,
                userId: 2,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);

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
            const delegate = async () => controller.completePayment(orderId, params);

            // Then
            await expect(delegate()).to.be.rejectedWith(NotFoundError, 'Order not found');
        });

        it('should throw a forbidden error if order is not pending', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderPaymentModel = {
                provider: PaymentProvider.PayPal,
                data: {
                    token: uuid()
                }
            };

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Complete,
                createTime: new Date(),
                updateTime: new Date()
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);

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
            const delegate = async () => controller.completePayment(orderId, params);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'Order is invalid');
        });

        it('should return result with retry action if payment unsuccessful', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderPaymentModel = {
                provider: PaymentProvider.PayPal,
                data: {
                    token: uuid()
                }
            };

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const expected: OrderPaymentCompleteModel = {
                status: order.status,
                payment: {
                    provider: PaymentProvider.PayPal,
                    status: PaymentStatus.Declined,
                    action: {
                        type: PaymentActionType.Retry
                    }
                }
            };

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                expiryMonth: 12,
                expiryYear: 2024,
                provider: PaymentProvider.Unipaas,
                lastFour: '1234',
                providerRef: 'abc12345',
                userId,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const payment: Payment = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                amount: 10,
                provider: PaymentProvider.PayPal,
                type: PaymentType.Purchase,
                providerRef: uuid(),
                paymentMethodId: paymentMethod.id,
                paymentMethod,
                status: PaymentStatus.Declined,
                createTime: new Date(),
                updateTime: new Date()
            };

            const mockGateway = mock<PaymentGateway>();
            when(mockGateway.completePayment(user, order.id.toString(), params.data)).thenResolve(payment);
            when(mockPaymentGatewayFactory.create(params.provider)).thenReturn(instance(mockGateway));
            when(mockOrderManager.get(orderId)).thenResolve(order);
            when(mockOrderPaymentMapper.from(order.status, payment)).thenReturn(expected);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.completePayment(orderId, params);

            // Then
            expect(result).to.deep.equal(expected);
            verify(mockOrderPaymentMapper.from(order.status, payment)).once();
            verify(mockOrderManager.addPayment(order, payment)).once();
            verify(mockOrderManager.setStatus(orderId, OrderStatus.Paid)).never();
        });

        it('should return result with prompt action if payment pending', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderPaymentModel = {
                provider: PaymentProvider.PayPal,
                data: {
                    token: uuid()
                }
            };

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const expected: OrderPaymentCompleteModel = {
                status: OrderStatus.PendingPayment,
                payment: {
                    provider: PaymentProvider.PayPal,
                    status: PaymentStatus.Pending,
                    action: {
                        type: PaymentActionType.Prompt,
                        message: 'We are waiting for your payment to clear'
                    }
                }
            };

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                expiryMonth: 12,
                expiryYear: 2024,
                provider: PaymentProvider.Unipaas,
                lastFour: '1234',
                providerRef: 'abc12345',
                userId,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const payment: Payment = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                amount: 10,
                provider: PaymentProvider.PayPal,
                type: PaymentType.Purchase,
                providerRef: uuid(),
                paymentMethodId: paymentMethod.id,
                paymentMethod,
                status: PaymentStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const mockGateway = mock<PaymentGateway>();
            when(mockGateway.completePayment(user, order.id.toString(), params.data)).thenResolve(payment);
            when(mockPaymentGatewayFactory.create(params.provider)).thenReturn(instance(mockGateway));
            when(mockOrderManager.get(orderId)).thenResolve(order);
            when(mockOrderPaymentMapper.from(OrderStatus.PendingPayment, payment)).thenReturn(expected);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.completePayment(orderId, params);

            // Then
            expect(result).to.deep.equal(expected);
            verify(mockOrderManager.addPayment(order, payment)).once();
            verify(mockOrderManager.setStatus(order.id, OrderStatus.PendingPayment)).once();
            verify(mockOrderPaymentMapper.from(OrderStatus.PendingPayment, payment)).once();
        });

        it('should throw a forbidden error if total paid is less than order total', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderPaymentModel = {
                provider: PaymentProvider.PayPal,
                data: {
                    token: uuid()
                }
            };

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                expiryMonth: 12,
                expiryYear: 2024,
                provider: PaymentProvider.Unipaas,
                lastFour: '1234',
                providerRef: 'abc12345',
                userId,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const payment: Payment = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                amount: 10,
                provider: PaymentProvider.PayPal,
                type: PaymentType.Purchase,
                providerRef: uuid(),
                paymentMethodId: paymentMethod.id,
                paymentMethod,
                status: PaymentStatus.Successful,
                createTime: new Date(),
                updateTime: new Date()
            };

            const mockGateway = mock<PaymentGateway>();
            when(mockGateway.completePayment(user, order.id.toString(), params.data)).thenResolve(payment);
            when(mockPaymentGatewayFactory.create(params.provider)).thenReturn(instance(mockGateway));
            when(mockOrderManager.get(orderId)).thenResolve(order);
            when(mockOrderManager.getTotalPaid(order)).thenResolve(5);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const delegate = async () => controller.completePayment(orderId, params);

            // Then
            await expect(delegate()).to.be.rejectedWith(ForbiddenError, 'Total payment is less than order amount.');
            verify(mockOrderManager.addPayment(order, payment)).once();
            verify(mockOrderManager.getTotalPaid(order)).once();
            verify(mockOrderManager.setStatus(orderId, OrderStatus.Paid)).never();
        });

        it('should set order to paid and return payment success result', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderPaymentModel = {
                provider: PaymentProvider.PayPal,
                data: {
                    token: uuid()
                }
            };

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Pending,
                createTime: new Date(),
                updateTime: new Date()
            };

            const expected: OrderPaymentCompleteModel = {
                status: order.status,
                payment: {
                    provider: PaymentProvider.PayPal,
                    status: PaymentStatus.Successful
                }
            };

            const paymentMethod: PaymentMethod = {
                id: 1,
                type: PaymentMethodType.CreditCard,
                cardType: PaymentMethodCardType.Visa,
                expiryMonth: 12,
                expiryYear: 2024,
                provider: PaymentProvider.Unipaas,
                lastFour: '1234',
                providerRef: 'abc12345',
                userId,
                enabled: true,
                createTime: new Date(),
                updateTime: new Date()
            };

            const payment: Payment = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                amount: 10,
                provider: PaymentProvider.PayPal,
                type: PaymentType.Purchase,
                providerRef: uuid(),
                paymentMethodId: paymentMethod.id,
                paymentMethod,
                status: PaymentStatus.Successful,
                createTime: new Date(),
                updateTime: new Date()
            };

            const mockGateway = mock<PaymentGateway>();
            when(mockGateway.completePayment(user, order.id.toString(), params.data)).thenResolve(payment);
            when(mockPaymentGatewayFactory.create(params.provider)).thenReturn(instance(mockGateway));
            when(mockOrderManager.get(orderId)).thenResolve(order);
            when(mockOrderManager.getTotalPaid(order)).thenResolve(10);
            when(mockOrderPaymentMapper.from(order.status, payment)).thenReturn(expected);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.completePayment(orderId, params);

            // Then
            expect(result).to.deep.equal(expected);
            verify(mockOrderPaymentMapper.from(order.status, payment)).once();
            verify(mockOrderManager.addPayment(order, payment)).once();
            verify(mockOrderManager.getTotalPaid(order)).once();
            verify(mockOrderManager.setStatus(orderId, OrderStatus.Paid)).once();
        });
        it('should only return order status if payment provider not in allowed list', async () => {
            // Given
            const orderId = 1;
            const userId = 1;
            const userSecureId = '76f36818-e45c-4b4d-9ce1-b6eff9357155';
            const skinId = 'tournament';
            const userType = UserType.Standard;

            const params: OrderPaymentModel = {
                provider: PaymentProvider.Paymentwall,
                data: {
                    token: uuid()
                }
            };

            const user = mockUser({
                id: userId,
                secureId: userSecureId,
                skinId,
                type: userType
            });

            const order: Order = {
                id: orderId,
                userId,
                currencyCode: 'USD',
                description: 'Something',
                items: [],
                payments: [],
                priceTotal: 10,
                status: OrderStatus.Complete,
                createTime: new Date(),
                updateTime: new Date()
            };

            const expected: OrderPaymentCompleteModel = {
                status: order.status
            };

            when(mockOrderManager.get(orderId)).thenResolve(order);
            when(mockOrderPaymentMapper.from(order.status)).thenReturn(expected);

            const controller = getController();

            const mockRequest = mockUserRequest<User>({
                user
            });
            controller.setRequest(instance(mockRequest));

            // When
            const result = await controller.completePayment(orderId, params);

            // Then
            expect(result).to.deep.equal(expected);
            verify(mockOrderManager.get(orderId)).once();
            verify(mockOrderPaymentMapper.from(order.status)).once();
        });
    });
});