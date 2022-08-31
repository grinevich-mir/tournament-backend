import { PlatformEvent } from '../../core/events';

export class OrderCreatedEvent extends PlatformEvent {
    constructor(public readonly orderId: number) {
        super('Order:Created');
    }
}