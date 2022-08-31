import { CouponManager, CouponRedemptionManager } from '../coupon';
import { NotFoundError } from '../core';
import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { Order } from './order';
import { OrderManager } from './order-manager';
import { OrderStatus } from './order-status';
import { OrderItemProcessorFactory } from './processing';

@Singleton
@LogClass()
export class OrderProcessor {
    constructor(
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly couponManager: CouponManager,
        @Inject private readonly couponRedemptionManager: CouponRedemptionManager,
        @Inject private readonly processorFactory: OrderItemProcessorFactory) {
    }

    public async process(id: number): Promise<void>;
    public async process(order: Order): Promise<void>;
    public async process(idOrOrder: number | Order): Promise<void> {
        const order = typeof idOrOrder === 'number' ? await this.orderManager.get(idOrOrder) : idOrOrder;

        if (!order)
            throw new NotFoundError(`Order not found.`);

        for (const item of order.items.filter(i => !i.processedTime)) {
            const processor = this.processorFactory.create(item.type);
            await processor.process(order, item);
            await this.orderManager.setItemProcessed(item.id, true);
            item.processedTime = new Date();
        }


        if (order.couponCode) {
            const coupon = await this.couponManager.getActive(order.couponCode);

            if (coupon)
                await this.couponRedemptionManager.add({
                    couponId: coupon.id,
                    userId: order.userId,
                    orderId: order.id
                });
        }

        await this.orderManager.setStatus(order.id, OrderStatus.Complete);
    }
}