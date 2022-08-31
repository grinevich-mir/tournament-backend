import { PlatformEvent } from '../../core/events';
import { JackpotPayout, JackpotTrigger } from '../../jackpot';

export class TournamentJackpotWinEvent extends PlatformEvent {
    constructor(
        public readonly tournamentId: number,
        public readonly trigger: JackpotTrigger,
        public readonly payout: JackpotPayout,
        public readonly winnerCount: number) {
        super('Tournament:JackpotWin');
    }
}