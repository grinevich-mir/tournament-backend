import { TournamentState } from '../tournament-state';

export interface TournamentLifecycleActionResult {
    startTime?: Date;
    endTime?: Date;
    nextState?: TournamentState;
    stop?: boolean;
}