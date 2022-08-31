import { PlatformEvent } from '../../core/events';

interface Payload {
    id: number;
    userId: number;
    entryId: number;
}

export class TournamentLeftEvent extends PlatformEvent {
    constructor(public readonly payload: Payload) {
        super('Tournament:Left');
    }
}