import { Tournament } from '../tournament';

export interface TournamentRuntime {
    launch(tournament: Tournament): Promise<void>;
    complete(tournament: Tournament): Promise<void>;
    cancel(tournament: Tournament): Promise<void>;
    fail(tournament: Tournament): Promise<void>;
    updateEndTime(tournament: Tournament, endTime: Date): Promise<void>;
}