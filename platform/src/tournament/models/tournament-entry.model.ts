import { Prize } from '../../prize';

export interface TournamentEntryModel {
    id: number;
    tournamentId: number;
    userId: number;
    token: string;
    prizes?: Prize[];
    rounds?: number;
    credit?: number;
    complete: boolean;
    allocations: number;
    totalCost: number;
    allocationsComplete: number;
    activated: boolean;
    createTime: Date;
    updateTime: Date;
}