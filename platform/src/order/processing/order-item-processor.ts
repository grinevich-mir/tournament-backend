import { Order } from '../order';
import { OrderItem } from '../order-item';

export interface OrderItemProcessor {
    process(order: Order, item: OrderItem): Promise<void>;
}