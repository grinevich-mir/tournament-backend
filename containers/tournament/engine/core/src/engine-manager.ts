import { Engine } from './engine';
import { Scheduler } from './scheduler';
import { TournamentLeaderboardManager } from './tournament-leaderboard-manager';
import moment from 'moment';
import { Singleton, Inject, Container } from '@tcom/platform/lib/core/ioc';
import { TournamentState, TournamentRoundResult, Tournament, TournamentManager } from '@tcom/platform/lib/tournament';
import { TournamentEventConsumer } from './tournament-event-consumer';
import _ from 'lodash';
import { Context } from './context';
import { ECSMetadataService } from './ecs-metadata-service';
import Logger, { LogContextResolver, LogClass } from '@tcom/platform/lib/core/logging';
import { Game } from '@tcom/platform/lib/game';

@Singleton
@LogClass()
export class EngineManager {
    private gameEventConsumer!: TournamentEventConsumer;
    private cancelling = false;

    public get tournamentId(): number {
        return this.context.tournamentId;
    }

    public get tournament(): Tournament {
        return this.context.tournament;
    }

    public get game(): Game {
        return this.context.game;
    }

    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly leaderboard: TournamentLeaderboardManager,
        @Inject private readonly scheduler: Scheduler,
        @Inject private readonly context: Context,
        @Inject private readonly ecsMetadataService: ECSMetadataService,
        @Inject private readonly engine: Engine) {
        this.engine.manager = this;

        Container.bind(LogContextResolver).provider({
            get: () => new LogContextResolver(() => ({
                application: `tournament-engine-${this.engine.name}-${this.context.tournamentId}`
            }))
        });
    }

    public async init(): Promise<void> {
        this.setup();

        Logger.info('Initialising...');
        Logger.info(`Tournament ID: ${this.tournamentId}`);
        await this.context.updateTournament();

        if (!this.tournament) {
            Logger.error(`Tournament ${this.tournamentId} not found! Aborting...`);
            await Logger.wait();
            process.exit(1);
        }

        const tournamentTaskId = await this.tournamentManager.getTaskId(this.tournamentId);

        if (!tournamentTaskId) {
            Logger.error(`Could not get Task ID for tournament ${this.tournamentId}! Aborting...`);
            await Logger.wait();
            process.exit(1);
        }

        const ecsTaskId = await this.ecsMetadataService.getTaskId();

        if (tournamentTaskId !== ecsTaskId) {
            Logger.error(`Task ID is ${ecsTaskId} but should be ${tournamentTaskId}! Aborting...`);
            await Logger.wait();
            process.exit(1);
        }

        if (this.tournament.state !== TournamentState.Launching) {
            Logger.error(`Tournament is in ${TournamentState[this.tournament.state]}, should be in Launching state! Aborting...`);
            await Logger.wait();
            process.exit(1);
        }

        await this.context.updateGame();

        if (!this.game) {
            Logger.error(`Game ${this.tournament.gameId} not found! Aborting...`);
            await Logger.wait();
            process.exit(1);
        }

        Logger.info('Tournament:', this.tournament);
        Logger.info('Game:', this.game);

        Logger.info('Initialising engine...');
        this.gameEventConsumer = new TournamentEventConsumer(this);
        await this.gameEventConsumer.init();

        await this.engine.init();
        await this.setState(TournamentState.Waiting);

        this.scheduler.schedule('start', new Date(this.tournament.startTime), async () => this.run());
        Logger.info(`Start scheduled for ${this.tournament.startTime}.`);

        if (this.tournament.endTime) {
            this.scheduler.schedule('end', new Date(this.tournament.endTime), async () => this.finalise());
            Logger.info(`End scheduled for ${this.tournament.endTime}.`);
        }

        Logger.info('Engine initialised.');
    }

    private async run(): Promise<void> {
        await this.context.updateTournament();

        if (!this.tournament.allowJoinAfterStart && this.tournament.playerCount < this.tournament.minPlayers) {
            Logger.warn(`Tournament player count of ${this.tournament.playerCount} does not meet the minimum of ${this.tournament.minPlayers} players.`);
            await this.cancel();
            return;
        }

        Logger.info('Running engine...');
        await this.setState(TournamentState.Running);
        await this.engine.start();

        if (this.tournament.leaderboardId)
            await this.leaderboard.start(this.tournament.leaderboardId);
    }

    public async roundResults(results: TournamentRoundResult[]): Promise<void> {
        Logger.info(`Round Results Received`, results);
        await this.engine.roundResults(results);
    }

    // TODO: Record cancellation reason
    public async cancel(): Promise<void> {
        if (this.cancelling)
            return;

        Logger.info('Cancelling tournament...');
        this.cancelling = true;
        await this.context.updateTournament();
        await this.engine.cancel();
        if (this.context.tournament.state <= TournamentState.Running)
            await this.setState(TournamentState.Cancelled);
        await this.shutdown();
    }

    public async finalise(): Promise<void> {
        Logger.info('Finalising tournament...');
        await this.setState(TournamentState.Finalising);
        const completionTime = moment().add(5, 'seconds').toDate();
        this.scheduler.schedule('complete', completionTime, async () => this.complete());
        Logger.info(`Completion scheduled for ${completionTime}.`);
    }

    private async complete(): Promise<void> {
        Logger.info('Completing tournament...');
        await this.context.updateTournament();
        await this.engine.complete();
        if (this.context.tournament.state <= TournamentState.Finalising)
            await this.setState(TournamentState.Ended);
        await this.shutdown();
    }

    // TODO: Record failure reason
    public async fail(): Promise<void> {
        Logger.info('Failing tournament...');
        try {
            await this.setState(TournamentState.Failed);
            await this.shutdown(1);
        } catch (err) {
            Logger.error('Error when attempting to fail tournament', err);
            await Logger.wait();
            process.exit(1);
        }
    }

    private async shutdown(exitCode: number = 0): Promise<void> {
        Logger.info('Shutting down engine...');
        this.scheduler.cancelAll();
        if (this.gameEventConsumer)
            await this.gameEventConsumer.shutdown();
        await this.leaderboard.shutdown();
        await this.engine.shutdown();
        await Logger.wait();
        process.exit(exitCode);
    }

    private async setState(state: TournamentState) {
        Logger.info(`Changing tournament state to ${state}...`);
        await this.tournamentManager.setState(this.tournamentId, state);

        if (this.tournament)
            this.tournament.state = state;
    }

    private setup(): void {
        Error.stackTraceLimit = 30;

        process.on('uncaughtException', async (err) => {
            Logger.error(err);
            await this.fail();
        });

        process.on('unhandledRejection', async (reason) => {
            if (reason instanceof Error)
                Logger.error(reason);
            else
                Logger.error(`Unhandled Rejection: ${reason}`);
            await this.fail();
        });

        process.on('SIGTERM', async () => {
            Logger.info('SIGTERM was received, cancelling...');
            await this.cancel();
        });
    }
}