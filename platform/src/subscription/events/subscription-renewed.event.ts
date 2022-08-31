import { PlatformEvent } from '../../core/events';
import { Subscription } from '../subscription';

export class SubscriptionRenewedEvent extends PlatformEvent {
    constructor(
        public readonly id: number,
        public readonly subscription: Subscription) {
        super('Subscription:Renewed');
    }
}