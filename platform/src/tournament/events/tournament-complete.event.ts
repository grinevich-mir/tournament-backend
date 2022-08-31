import { TournamentState } from '../tournament-state';
import { PlatformEvent } from '../../core/events';

interface Payload {
    id: number;
    state: TournamentState;
}

export class TournamentCompleteEvent extends PlatformEvent {
    constructor(public readonly payload: Payload) {
        super('Tournament:Complete');
    }
}