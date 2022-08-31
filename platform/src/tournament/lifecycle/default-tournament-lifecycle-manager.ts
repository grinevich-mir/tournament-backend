import _ from 'lodash';
import { Singleton } from '../../core/ioc';
import Logger, { LogClass } from '../../core/logging';
import { Tournament } from '../tournament';
import { TournamentState } from '../tournament-state';
import { TournamentLifecycleActionResult } from './tournament-lifecycle-action-result';
import { TournamentLifecycleManager } from './tournament-lifecycle-manager';

@Singleton
@LogClass()
export class DefaultTournamentLifecycleManager implements TournamentLifecycleManager {
    public async launch(tournament: Tournament): Promise<TournamentLifecycleActionResult> {
        if (tournament.state !== TournamentState.Scheduled)
            return {
                nextState: tournament.state
            };

        return {
            nextState: TournamentState.Waiting
        };
    }

    public async start(tournament: Tournament): Promise<TournamentLifecycleActionResult> {
        if (tournament.state !== TournamentState.Waiting)
            return {
                nextState: tournament.state
            };

        if (!tournament.allowJoinAfterStart && tournament.playerCount < tournament.minPlayers) {
            Logger.warn(`Tournament player count of ${tournament.playerCount} does not meet the minimum of ${tournament.minPlayers} players.`);
            return {
                nextState: TournamentState.Cancelled,
                stop: true
            };
        }

        return {
            nextState: TournamentState.Running
        };
    }

    public async finalise(tournament: Tournament): Promise<TournamentLifecycleActionResult> {
        if (tournament.state !== TournamentState.Running)
            return {
                stop: true
            };

        return {
            nextState: TournamentState.Finalising
        };
    }

    public async end(tournament: Tournament): Promise<TournamentLifecycleActionResult> {
        if (tournament.state !== TournamentState.Running && tournament.state !== TournamentState.Finalising)
            return {
                stop: true
            };

        return {
            nextState: TournamentState.Ended
        };
    }
}