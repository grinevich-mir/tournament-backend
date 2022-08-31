import { Prize } from '../../prize';

export interface TournamentWinnerModel {
    id: string;
    displayName: string;
    tournamentId: number;
    tournamentName: string;
    tournamentType: string;
    avatarUrl?: string;
    country: string;
    isPlayer: boolean;
    prize: Prize;
    date: Date;
}