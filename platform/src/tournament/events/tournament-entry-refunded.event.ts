import { PlatformEvent } from '../../core/events';

interface Payload {
    id: number;
    userId: number;
    tournamentId: number;
    refundedCost: number;
}

export class TournamentEntryRefundedEvent extends PlatformEvent {
    constructor(public readonly payload: Payload) {
        super('Tournament:Entry:Refunded');
    }
}