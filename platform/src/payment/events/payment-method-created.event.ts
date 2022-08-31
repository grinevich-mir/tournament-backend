import { PlatformEvent } from '../../core/events';
import { PaymentMethod } from '../payment-method';

export class PaymentMethodCreatedEvent extends PlatformEvent {
    constructor(public readonly paymentMethod: PaymentMethod) {
        super('Payment:Method:Created');
    }
}