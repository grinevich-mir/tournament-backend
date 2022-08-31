import { TournamentEntryAllocation } from './tournament-entry-allocation';
import { Prize } from '../prize';

export interface TournamentEntry {
    id: number;
    userId: number;
    tournamentId: number;
    knockedOut: boolean;
    token: string;
    prizes: Prize[];
    allocations: TournamentEntryAllocation[];
    totalCost: number;
    activatedTime?: Date;
    refundTime?: Date;
    createTime: Date;
    updateTime: Date;
}

export interface RankedTournamentEntry extends TournamentEntry {
    rank: number;
}