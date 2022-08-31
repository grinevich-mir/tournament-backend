import { PlatformEvent, PlatformEventAttributes } from '../../core/events';
import { JackpotPayout } from '../../jackpot';
import { TournamentEntry } from '../tournament-entry';
import { Prize } from '../../prize';

export interface TournamentResultEventWinner {
    entryId: number;
    userId: number;
    tournamentId: number;
    prizes: Prize[];
    totalCost: number;
}

export class TournamentResultEvent extends PlatformEvent {
    public get attributes(): PlatformEventAttributes {
        return {
            HasJackpotPayouts: this.jackpotPayouts && this.jackpotPayouts.length > 0 ? 'true' : 'false'
        };
    }

    public readonly winners: TournamentResultEventWinner[] = [];

    constructor(
        public readonly tournamentId: number,
        entries: TournamentEntry[],
        public readonly jackpotPayouts?: JackpotPayout[]) {
        super('Tournament:Result');

        this.winners = entries.map(e => ({
            entryId: e.id,
            prizes: e.prizes,
            totalCost: e.totalCost,
            tournamentId: e.tournamentId,
            userId: e.userId
        }));
    }
}