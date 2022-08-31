import { PlatformEvent, PlatformEventAttributes } from '../../core/events';
import { WithdrawalRequestStatus } from '../withdrawal-request-status';

export class WithdrawalRequestStatusChangedEvent extends PlatformEvent {
    public get attributes(): PlatformEventAttributes {
        return {
            Status: this.status
        };
    }

    constructor(public readonly id: string, public readonly status: WithdrawalRequestStatus) {
        super('Banking:WithdrawalRequest:StatusChanged');
    }
}