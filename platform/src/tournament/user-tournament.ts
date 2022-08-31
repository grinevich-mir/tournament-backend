import { Tournament } from './tournament';
import { TournamentEntry } from './tournament-entry';

export interface UserTournament extends Tournament {
    entry?: TournamentEntry;
}