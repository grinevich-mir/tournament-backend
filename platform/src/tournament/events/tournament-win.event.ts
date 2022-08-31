import { PlatformEvent } from '../../core/events';
import { Prize } from '../../prize';

export class TournamentWinEvent extends PlatformEvent {
    constructor(
        public readonly entryId: number,
        public readonly userId: number,
        public readonly tournamentId: number,
        public readonly prizes: Prize[],
        public readonly rank?: number) {
        super('Tournament:Win');
    }
}