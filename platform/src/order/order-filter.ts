import { PagedFilter } from '../core';
import { Order } from './order';
import { OrderStatus } from './order-status';

export interface OrderFilter extends PagedFilter<Order> {
    userId?: number;
    statuses?: OrderStatus[];
}