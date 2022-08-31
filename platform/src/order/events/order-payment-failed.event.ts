import { PlatformEvent } from '../../core/events';
import { Payment } from '../../payment';

export class OrderPaymentFailedEvent extends PlatformEvent {
    constructor(
        public readonly orderId: number,
        public readonly payment: Payment) {
        super('Order:PaymentFailed');
    }
}