import { PlatformEvent } from '../../core/events';

export class WithdrawalRequestAddedEvent extends PlatformEvent {
    constructor(public readonly id: string) {
        super('Banking:WithdrawalRequest:Added');
    }
}