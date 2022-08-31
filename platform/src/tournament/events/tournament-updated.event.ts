import { PlatformEvent } from '../../core/events';

interface Payload {
    id: number;
    endTime?: Date;
    endTimeChanged?: boolean;
}

export class TournamentUpdatedEvent extends PlatformEvent {
    constructor(public readonly payload: Payload) {
        super('Tournament:Updated');
    }
}