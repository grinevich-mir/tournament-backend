import { OrderItemType } from './order-item-type';

export interface NewOrderItem {
    type: OrderItemType;
    description: string;
    quantity: number;
    price: number;
}

export interface OrderItem extends NewOrderItem {
    id: number;
    processedTime?: Date;
    createTime: Date;
}