import { TournamentType } from './tournament-type';
import { Prize } from '../prize';

export interface TournamentWinner {
    id: string;
    entryId: number;
    userId: number;
    tournamentId: number;
    tournamentName: string;
    tournamentType: TournamentType;
    prize: Prize;
    skins: string[];
    date: Date;
}