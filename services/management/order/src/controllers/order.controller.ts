import { AdminController, Route, Tags, Security, Get, Query, Post, Body, Delete } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NewOrder, Order, OrderFilter, OrderManager, OrderProcessor, OrderStatus } from '@tcom/platform/lib/order';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';

@Tags('Order')
@Route('order')
@LogClass()
export class OrderController extends AdminController {
    constructor(
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly orderProcessor: OrderProcessor) {
        super();
    }

    /**
     * @summary Gets all orders
     * @param userId A users ID
     * @param status The status of the orders
     */
    @Get()
    @Security('admin', ['order:read'])
    public async getAll(
        @Query() userId?: number,
        @Query() status?: OrderStatus,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<Order>> {
        const filter: OrderFilter = {
            userId,
            statuses: status ? [status] : undefined,
            page,
            pageSize,
            order: {
                createTime: 'DESC'
            }
        };

        return this.orderManager.getAll(filter);
    }

    /**
     * @summary Gets an order
     */
    @Get('{id}')
    @Security('admin', ['order:read'])
    public async get(id: number): Promise<Order> {
        const order = await this.orderManager.get(id);

        if (!order)
            throw new NotFoundError('Order not found.');

        return order;
    }

    /**
     * @summary Adds a new order
     */
    @Post()
    @Security('admin', ['order:write'])
    public async add(@Body() order: NewOrder): Promise<Order> {
        return this.orderManager.add(order);
    }

    /**
     * @summary Removes an order
     */
    @Delete('{id}')
    @Security('admin', ['order:delete'])
    public async remove(id: number): Promise<void> {
        await this.orderManager.remove(id);
    }

    /**
     * @summary Processes an order manually
     */
    @Post('{id}/process')
    @Security('admin', ['order:write'])
    public async process(id: number): Promise<Order> {
        const order = await this.orderManager.get(id);

        if (!order)
            throw new NotFoundError('Order not found.');

        await this.orderProcessor.process(order);
        return await this.orderManager.get(id) as Order;
    }
}
