import { PlatformEvent } from '../../core/events';

interface Payload {
    id: number;
    name: string;
    chatEnabled: boolean;
    chatChannel?: string;
}

export class TournamentCreatedEvent extends PlatformEvent {
    constructor(public readonly payload: Payload) {
        super('Tournament:Created');
    }
}