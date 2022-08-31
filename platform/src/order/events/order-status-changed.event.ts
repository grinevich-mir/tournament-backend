import { PlatformEvent, PlatformEventAttributes } from '../../core/events';
import { OrderStatus } from '../order-status';

export class OrderStatusChangedEvent extends PlatformEvent {
    public get attributes(): PlatformEventAttributes {
        return {
            From: this.from,
            To: this.to
        };
    }

    constructor(
        public readonly id: number,
        public readonly from: OrderStatus,
        public readonly to: OrderStatus) {
        super('Order:StatusChanged');
    }
}