import _ from 'lodash';
import { Inject, Singleton } from '../../../core/ioc';
import { PaymentEntityMapper } from '../../../payment/entities/mappers';
import { NewOrder, Order } from '../../order';
import { NewOrderItem, OrderItem } from '../../order-item';
import { OrderItemEntity } from '../order-item.entity';
import { OrderEntity } from '../order.entity';

@Singleton
export class OrderEntityMapper {
    constructor(@Inject private readonly paymentMapper: PaymentEntityMapper) {
    }

    public newToEntity(source: NewOrder): OrderEntity {
        const entity = new OrderEntity();
        entity.userId = source.userId;
        entity.description = source.description;
        entity.currencyCode = source.currencyCode;
        entity.couponCode = source.couponCode;
        entity.couponTotal = source.couponTotal;
        entity.priceTotal = Math.max(0, _.sumBy(source.items, i => i.price) - (source.couponTotal ?? 0));
        entity.items = source.items.map(i => this.newItemToEntity(i));
        return entity;
    }

    public fromEntity(source: OrderEntity): Order {
        return {
            id: source.id,
            userId: source.userId,
            status: source.status,
            description: source.description,
            currencyCode: source.currencyCode,
            couponCode: source.couponCode,
            couponTotal: source.couponTotal,
            priceTotal: source.priceTotal,
            items: source.items.map(i => this.itemFromEntity(i)),
            payments: source.payments.map(p => this.paymentMapper.fromEntity(p)),
            completeTime: source.completeTime,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public newItemToEntity(source: NewOrderItem): OrderItemEntity {
        const entity = new OrderItemEntity();
        entity.type = source.type;
        entity.quantity = source.quantity;
        entity.description = source.description;
        entity.price = source.price;
        return entity;
    }

    public itemFromEntity(source: OrderItemEntity): OrderItem {
        return {
            id: source.id,
            type: source.type,
            description: source.description,
            quantity: source.quantity,
            price: source.price,
            processedTime: source.processedTime,
            createTime: source.createTime
        };
    }
}