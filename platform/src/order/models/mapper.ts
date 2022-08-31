import { Inject, Singleton } from '../../core/ioc';
import { PaymentModelMapper } from '../../payment/models';
import { Order } from '../order';
import { OrderModel } from './order.model';

@Singleton
export class OrderModelMapper {
    constructor(
        @Inject private readonly paymentMapper: PaymentModelMapper) {
    }

    public mapAll(orders: Order[]): OrderModel[] {
        return orders.map(o => this.map(o));
    }

    public map(order: Order): OrderModel {
        return {
            id: order.id,
            description: order.description,
            currencyCode: order.currencyCode,
            couponCode: order.couponCode,
            couponTotal: order.couponTotal,
            priceTotal: order.priceTotal,
            status: order.status,
            payments: order.payments.map(p => this.paymentMapper.map(p)),
            items: order.items,
            createTime: order.createTime,
            updateTime: order.updateTime,
            completeTime: order.completeTime
        };
    }
}