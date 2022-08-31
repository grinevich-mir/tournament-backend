import { PlatformEvent } from '../../core/events';

interface Payload {
    id: number;
    userId: number;
    tournamentId: number;
}

export class TournamentEntryActivatedEvent extends PlatformEvent {
    constructor(public readonly payload: Payload) {
        super('Tournament:Entry:Activated');
    }
}