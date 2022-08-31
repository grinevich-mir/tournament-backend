import { PlatformEvent, PlatformEventAttributes } from '../../core/events';
import { PaymentStatus } from '../payment-status';
import { Payment } from '../payment';

export class PaymentStatusChangedEvent extends PlatformEvent {
    public get attributes(): PlatformEventAttributes {
        return {
            From: this.from,
            To: this.to
        };
    }

    constructor(
        public readonly payment: Payment,
        public readonly from: PaymentStatus,
        public readonly to: PaymentStatus) {
        super('Payment:StatusChanged');
    }
}