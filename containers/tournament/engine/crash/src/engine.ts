import { Engine, Ignition } from '@tcom/tournament-engine-core';
import { Provides, Inject } from '@tcom/platform/lib/core/ioc';
import { Scheduler } from '@tcom/tournament-engine-core/lib/scheduler';
import { TournamentRoundResult } from '@tcom/platform/lib/tournament';
import moment from 'moment';
import { CrashClient, CreateLobbyRequest, LobbyConfig, GameState } from '@tcom/platform/lib/integration/crash';
import { PrizeType, CashRankedPrize } from '@tcom/platform/lib/prize';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import _ from 'lodash';

@Provides(Engine)
@LogClass()
export class CrashEngine extends Engine {
    public name = 'crash';

    constructor(
        @Inject private readonly client: CrashClient,
        @Inject private readonly scheduler: Scheduler) {
        super();
    }

    public async init(): Promise<void> {
        Logger.info('Crash Engine: Init');
        const request = this.getCreateLobbyRequest();
        Logger.info('Crash Engine: Creating lobby:', request);
        await this.client.createGame(request);
        Logger.info('Crash Engine: Lobby created.');
        await this.client.launchGame(request.gameId);
        Logger.info('Crash Engine: Game launch started.');
    }

    public async start(): Promise<void> {
        Logger.info('Crash Engine: Start');

        if (!this.manager.tournament.endTime)
            this.scheduler.schedule('cancel', moment().utc().add(2, 'hours').toDate(), () => this.manager.cancel());
        else
            this.scheduler.schedule('end', moment(this.manager.tournament.endTime).utc().add(2, 'hours').toDate(), () => this.manager.finalise());

        const game = await this.client.getGame(this.manager.tournamentId);

        if (game.state === GameState.Cancelled) {
            Logger.info('Crash game is in a cancelled state, wait for call from RGS to cancel tournament, or cancel in 5 minutes.');
            this.scheduler.schedule('cancel', moment().utc().add(5, 'minutes').toDate(), () => this.manager.cancel());
            return;
        }

        if (game.state < GameState.Waiting)
            throw new Error(`Crash game ${this.manager.tournamentId} is not in a running state, aborting.`);

        Logger.info('Crash game is running...');
    }

    public async cancel(): Promise<void> {
        Logger.info('Crash Engine: Cancel');
    }

    public async complete(): Promise<void> {
        Logger.info('Crash Engine: Complete');
    }

    public async shutdown(): Promise<void> {
        Logger.info('Crash Engine: Shutdown');
    }

    public async roundResults(results: TournamentRoundResult[]): Promise<void> {
        Logger.info('Crash Engine: Round Results', results);
        await this.manager.finalise();
    }

    private getCreateLobbyRequest(): CreateLobbyRequest {
        const tournament = this.manager.tournament;
        const game = this.manager.game;

        let prizeAmount = tournament.prizeTotal || 0;

        if (tournament.prizes.length > 0) {
            const prize = tournament.prizes[0] as CashRankedPrize;

            if (prize.type !== PrizeType.Cash)
                throw new Error('Tournament prize must be Cash type.');

            prizeAmount = prize.amount;
        }

        const config: LobbyConfig = {
            name: tournament.name,
            prizeAmount,
            currency: tournament.currencyCode,
            minPlayerCount: tournament.minPlayers,
            maxPlayerCount: tournament.maxPlayers,
            startTime: moment(tournament.startTime).unix(),
            maxRoundDuration: 120,
            cutOffTime: 8,
            safeTime: 0
        };

        if (tournament.endTime)
            config.endTime = moment(tournament.endTime).unix();

        if (game.metadata) {
            if (game.metadata.maxRoundDuration)
                config.maxRoundDuration = game.metadata.maxRoundDuration;
            if (game.metadata.cutOffTime)
                config.cutOffTime = game.metadata.cutOffTime;
            if (game.metadata.maxRounds)
                config.maxRounds = game.metadata.maxRounds;
            if (game.metadata.extremeValue)
                config.extremeValue = game.metadata.extremeValue;
            if (game.metadata.houseEdge)
                config.houseEdge = game.metadata.houseEdge;
            if (game.metadata.safeTime)
                config.safeTime = game.metadata.safeTime;
            if (game.metadata.livesPerEntry)
                config.livesPerEntry = game.metadata.livesPerEntry;
        }

        return {
            gameId: tournament.id.toString(),
            config
        };
    }
}

Ignition.start().catch(err => { throw err; });
