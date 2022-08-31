import { Post, Response, Route, Security, SuccessResponse, Tags, ClientController, Body, Get, Query } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { OrderFilter, OrderManager, OrderStatus } from '@tcom/platform/lib/order';
import { OrderModel, OrderModelMapper } from '@tcom/platform/lib/order/models';
import { ForbiddenError, NotFoundError, UnauthorizedError, BadRequestError } from '@tcom/platform/lib/core/errors';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PaymentGatewayFactory } from '@tcom/platform/lib/payment/providers';
import { OrderCheckoutParamsModel, OrderCheckoutResultModel, OrderPaymentOptionsModel, OrderPaymentModel, OrderPaymentCompleteModel } from '../models';
import { OrderPaymentCompleteModelMapper } from '../models/mappers';
import { PaymentMethodManager, PaymentProvider, PaymentInitResult, PaymentResult, PaymentStatus } from '@tcom/platform/lib/payment';
import { PagedResult } from '@tcom/platform/lib/core';
import _ from 'lodash';

const ORDER_COMPLETE_PAYMENT_PROVIDERS = [
    PaymentProvider.PayPal
];

@Tags('Order')
@Route('order')
@Security('cognito')
@LogClass()
export class OrderController extends ClientController {
    constructor(
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly paymentMethodManager: PaymentMethodManager,
        @Inject private readonly paymentGatewayFactory: PaymentGatewayFactory,
        @Inject private readonly orderMapper: OrderModelMapper,
        @Inject private readonly orderPaymentMapper: OrderPaymentCompleteModelMapper) {
        super();
    }

    /**
     * @summary Gets a list of the users orders
     * @isInt page
     * @isInt pageSize
     */
    @Get()
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    public async getAll(@Query() page: number = 1, @Query() pageSize: number = 20): Promise<PagedResult<OrderModel>> {
        const filter: OrderFilter = {
            userId: this.user.id,
            statuses: [OrderStatus.Paid, OrderStatus.Complete],
            page,
            pageSize,
            order: {
                createTime: 'DESC'
            }
        };

        const result = await this.orderManager.getAll(filter);
        const models = this.orderMapper.mapAll(result.items);
        return new PagedResult(models, result.totalCount, result.page, result.pageSize);
    }

    /**
     * @summary Get a specific order for the user
     * @isInt page
     * @isInt pageSize
     */
    @Get('{id}')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    public async get(id: number): Promise<OrderModel> {
        const order = await this.orderManager.get(id);

        if (!order || order.userId !== this.user.id)
            throw new NotFoundError('Order not found.');

        return this.orderMapper.map(order);
    }

    /**
     * @summary Gets a checkout URL for the supplied order ID
     * @isInt id
     */
    // TODO: Validate return url
    @Post('checkout')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    @Response<NotFoundError>(404, 'Order not found')
    public async checkout(@Body() params: OrderCheckoutParamsModel): Promise<OrderCheckoutResultModel> {
        const order = await this.orderManager.get(params.orderId);

        if (!order || order.userId !== this.user.id)
            throw new NotFoundError('Order not found.');

        if (order.status !== OrderStatus.Pending)
            throw new ForbiddenError('Order is invalid.');

        const gateway = this.paymentGatewayFactory.create(params.provider);
        const checkoutUrl = await gateway.getCheckoutUrl(
            this.user,
            order.priceTotal,
            order.currencyCode,
            order.description,
            order.id.toString(),
            params.returnUrl,
            params.cancelUrl);

        return {
            checkoutUrl,
            provider: params.provider
        };
    }

    /**
     * @summary Takes payment for an order
     * @isInt id
     */
    @Post('{id}/payment')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    @Response<NotFoundError>(404, 'Order not found')
    public async takePayment(id: number, @Body() options?: OrderPaymentOptionsModel): Promise<PaymentResult> {
        const order = await this.orderManager.get(id);

        if (!order || order.userId !== this.user.id)
            throw new NotFoundError('Order not found.');

        if (order.status !== OrderStatus.Pending)
            throw new ForbiddenError('Order is invalid.');

        const paymentMethod = await this.paymentMethodManager.getActiveForUser(this.user.id);

        if (!paymentMethod)
            throw new ForbiddenError('User does not have an active payment method.');

        const gateway = this.paymentGatewayFactory.create(paymentMethod.provider);
        const result = await gateway.takePayment(this.user, paymentMethod, order.priceTotal, order.currencyCode, order.id.toString(), order.description, options?.redirectUrl);

        if (result.status === PaymentStatus.Successful)
            await this.orderManager.setStatus(order.id, OrderStatus.Paid);

        return result;
    }

    /**
     * @summary Initialises payment for an order
     * @isInt id
     */
    @Post('{id}/payment/init')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    @Response<NotFoundError>(404, 'Order not found')
    public async initPayment(id: number): Promise<PaymentInitResult> {
        const order = await this.orderManager.get(id);

        if (!order || order.userId !== this.user.id)
            throw new NotFoundError('Order not found.');

        if (order.status !== OrderStatus.Pending)
            throw new ForbiddenError('Order is invalid.');

        const paymentMethod = await this.paymentMethodManager.getActiveForUser(this.user.id);

        if (!paymentMethod || paymentMethod.provider !== PaymentProvider.Unipaas)
            throw new ForbiddenError('User does not have an active payment method.');

        const gateway = this.paymentGatewayFactory.create(paymentMethod.provider);
        return gateway.initPayment(this.user, paymentMethod, order.priceTotal, order.currencyCode, order.description, order.id.toString());
    }

    /**
     * @summary Completes payment for an order
     * @isInt id
     */
    @Post('{id}/payment/complete')
    @SuccessResponse(200, 'Ok')
    @Response<BadRequestError>(400)
    @Response<UnauthorizedError>(401)
    @Response<ForbiddenError>(403)
    @Response<NotFoundError>(404)
    public async completePayment(id: number, @Body() params: OrderPaymentModel): Promise<OrderPaymentCompleteModel> {
        const order = await this.orderManager.get(id);

        if (!order || order.userId !== this.user.id)
            throw new NotFoundError('Order not found.');

        if (!ORDER_COMPLETE_PAYMENT_PROVIDERS.includes(params.provider))
            return this.orderPaymentMapper.from(order.status);

        if (order.status !== OrderStatus.Pending)
            throw new ForbiddenError('Order is invalid.');

        const gateway = this.paymentGatewayFactory.create(params.provider);
        const payment = await gateway.completePayment(this.user, order.id.toString(), params.data);

        await this.orderManager.addPayment(order, payment);

        if (payment.status === PaymentStatus.Pending) {
            await this.orderManager.setStatus(order.id, OrderStatus.PendingPayment);
            return this.orderPaymentMapper.from(OrderStatus.PendingPayment, payment);
        }

        if (payment.status !== PaymentStatus.Successful)
            return this.orderPaymentMapper.from(order.status, payment);

        const totalPaid = await this.orderManager.getTotalPaid(order);

        if (totalPaid < order.priceTotal)
            throw new ForbiddenError('Total payment is less than order amount.');

        await this.orderManager.setStatus(order.id, OrderStatus.Paid);

        return this.orderPaymentMapper.from(order.status, payment);
    }
}
