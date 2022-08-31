import { Payment } from '../payment';
import { NewOrderItem, OrderItem } from './order-item';
import { OrderStatus } from './order-status';

export interface NewOrder<T extends NewOrderItem = NewOrderItem> {
    userId: number;
    description: string;
    currencyCode: string;
    couponCode?: string;
    couponTotal?: number;
    items: T[];
}

export interface Order extends NewOrder<OrderItem> {
    id: number;
    status: OrderStatus;
    priceTotal: number;
    payments: Payment[];
    completeTime?: Date;
    createTime: Date;
    updateTime: Date;
}