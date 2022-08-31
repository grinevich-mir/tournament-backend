import { Engine, Ignition } from '@tcom/tournament-engine-core';
import { Provides, Inject } from '@tcom/platform/lib/core/ioc';
import { Scheduler } from '@tcom/tournament-engine-core/lib/scheduler';
import { TournamentRoundResult, TournamentLeaderboardMode } from '@tcom/platform/lib/tournament';
import moment from 'moment';
import { HiloClient, CreateLobbyRequest, LobbyConfig, GameMode, GameState } from '@tcom/platform/lib/integration/hilo';
import { PrizeType, CashRankedPrize } from '@tcom/platform/lib/prize';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import _ from 'lodash';

@Provides(Engine)
@LogClass()
export class HiLoEngine extends Engine {
    public name = 'hilo';

    constructor(
        @Inject private readonly client: HiloClient,
        @Inject private readonly scheduler: Scheduler) {
        super();
    }

    public async init(): Promise<void> {
        Logger.info('HiLo Engine: Init');
        const request = this.getCreateLobbyRequest();
        Logger.info('HiLo Engine: Creating game:', request);
        await this.client.createGame(request);
        Logger.info('HiLo Engine: Game created.');
        await this.client.launchGame(request.gameId);
        Logger.info('HiLo Engine: Game launch started.');
    }

    public async start(): Promise<void> {
        Logger.info('HiLo Engine: Start');

        if (!this.manager.tournament.endTime)
            this.scheduler.schedule('cancel', moment().utc().add(2, 'hours').toDate(), () => this.manager.cancel());
        else
            this.scheduler.schedule('end', moment(this.manager.tournament.endTime).utc().add(2, 'hours').toDate(), () => this.manager.finalise());

        const game = await this.client.getGame(this.manager.tournamentId);

        if (game.state === GameState.Cancelled) {
            Logger.info('HiLo game is in a cancelled state, wait for call from RGS to cancel tournament, or cancel in 5 minutes.');
            this.scheduler.schedule('cancel', moment().utc().add(5, 'minutes').toDate(), () => this.manager.cancel());
            return;
        }

        if (game.state < GameState.Waiting)
            throw new Error(`HiLo game ${this.manager.tournamentId} is not in a running state, aborting.`);

        Logger.info('HiLo game is running...');
    }

    public async cancel(): Promise<void> {
        Logger.info('HiLo Engine: Cancel');
    }

    public async complete(): Promise<void> {
        Logger.info('HiLo Engine: Complete');
    }

    public async shutdown(): Promise<void> {
        Logger.info('HiLo Engine: Shutdown');
    }

    public async roundResults(results: TournamentRoundResult[]): Promise<void> {
        Logger.info('HiLo Engine: Round Results', results);
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
            mode: GameMode.Standard,
            prizeAmount,
            currency: tournament.currencyCode,
            minPlayerCount: tournament.minPlayers,
            maxPlayerCount: tournament.maxPlayers,
            startTime: moment(tournament.startTime).unix(),
            roundDuration: 30,
            cutOffTime: 5
        };

        if (game.metadata) {
            if (game.metadata.minNumber)
                config.minNumber = game.metadata.minNumber;
            if (game.metadata.maxNumber)
                config.maxNumber = game.metadata.maxNumber;
            if (game.metadata.testMode)
                config.testMode = game.metadata.testMode;
            if (game.metadata.roundDuration)
                config.roundDuration = game.metadata.roundDuration;
            if (game.metadata.cutOffTime)
                config.cutOffTime = game.metadata.cutOffTime;

            switch (game.metadata.mode) {
                default:
                    if (game.metadata.maxWinners)
                        config.maxWinners = game.metadata.maxWinners;
                    if (game.metadata.maxRounds)
                        config.maxRounds = game.metadata.maxRounds;
                    break;

                case GameMode.Leaderboard:
                    if (tournament.leaderboardMode === TournamentLeaderboardMode.Disabled)
                        throw new Error('Tournament leaderboard must not be disabled.');

                    config.mode = GameMode.Leaderboard;
                    config.prizeAmount = tournament.prizeTotal || prizeAmount;
                    config.livesPerEntry = game.metadata.livesPerEntry || 1;

                    if (tournament.metadata?.pointsPerRound)
                        config.pointsPerRound = tournament.metadata.pointsPerRound;

                    if (!tournament.endTime)
                        throw new Error('Tournament must have an end time for this hilo game mode.');

                    config.endTime = moment(tournament.endTime).unix();
                    break;

                case GameMode.Perpetual:
                    config.mode = GameMode.Perpetual;
                    config.prizeAmount = tournament.prizeTotal || prizeAmount;
                    config.livesPerEntry = game.metadata.livesPerEntry || 1;

                    if (!tournament.endTime)
                        throw new Error('Tournament must have an end time for this hilo game mode.');

                    config.endTime = moment(tournament.endTime).unix();
                    const cashPrizes = tournament.prizes.filter(p => p.type === PrizeType.Cash) as CashRankedPrize[];

                    config.prizeLadder = _.sortBy(cashPrizes, p => p.startRank).map(p => ({
                        roundNumber: p.endRank,
                        prizeAmount: p.amount
                    }));
                    break;

                case GameMode.Roulette:
                    config.mode = GameMode.Roulette;
                    config.prizeAmount = tournament.prizeTotal || prizeAmount;
                    config.chips = game.metadata.chips || [10, 25, 50, 75, 100];
                    config.multipliers = game.metadata.multipliers || [1, 9, 2, 10, 6, 5, 10, 4, 7, 10 ,3, 8];
                    config.livesPerEntry = game.metadata.livesPerEntry || 1;

                    if (!tournament.endTime)
                        throw new Error('Tournament must have an end time for this hilo game mode.');

                    config.endTime = moment(tournament.endTime).unix();
                    break;
            }
        }

        return {
            gameId: tournament.id.toString(),
            config
        };
    }
}

Ignition.start().catch(err => { throw err; });
