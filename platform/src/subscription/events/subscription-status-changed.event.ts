import { PlatformEvent, PlatformEventAttributes } from '../../core/events';
import { Subscription } from '../subscription';
import { SubscriptionStatus } from '../subscription-status';

export class SubscriptionStatusChangedEvent extends PlatformEvent {
    public get attributes(): PlatformEventAttributes {
        return {
            From: this.from,
            To: this.to
        };
    }

    constructor(
        public readonly id: number,
        public readonly subscription: Subscription,
        public readonly from: SubscriptionStatus,
        public readonly to: SubscriptionStatus) {
        super('Subscription:StatusChanged');
    }
}