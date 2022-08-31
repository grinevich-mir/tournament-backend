import { Tournament } from '../tournament';
import { TournamentLifecycleActionResult } from './tournament-lifecycle-action-result';

export interface TournamentLifecycleManager {
    launch(tournament: Tournament): Promise<TournamentLifecycleActionResult>;
    start(tournament: Tournament): Promise<TournamentLifecycleActionResult>;
    finalise(tournament: Tournament): Promise<TournamentLifecycleActionResult>;
    end(tournament: Tournament): Promise<TournamentLifecycleActionResult>;
}