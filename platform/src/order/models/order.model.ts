import { PaymentModel } from '../../payment/models';
import { OrderItem } from '../order-item';
import { OrderStatus } from '../order-status';

export interface OrderModel {
    id: number;
    description: string;
    currencyCode: string;
    status: OrderStatus;
    couponCode?: string;
    couponTotal?: number;
    priceTotal: number;
    payments: PaymentModel[];
    items: OrderItem[];
    completeTime?: Date;
    createTime: Date;
    updateTime: Date;
}