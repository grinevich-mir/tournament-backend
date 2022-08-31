import { PlatformEvent } from '../../core/events';

export class SubscriptionTierChangedEvent extends PlatformEvent {
    constructor(
        public readonly id: number,
        public readonly fromId: number,
        public readonly toId: number) {
        super('Subscription:TierChanged');
    }
}