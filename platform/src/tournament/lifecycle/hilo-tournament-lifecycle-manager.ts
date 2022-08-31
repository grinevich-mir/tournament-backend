import _ from 'lodash';
import moment from 'moment';
import { Inject, Singleton } from '../../core/ioc';
import Logger, { LogClass } from '../../core/logging';
import { Game, GameManager } from '../../game';
import { CreateLobbyRequest, GameMode, GameState, HiloClient, LobbyConfig } from '../../integration/hilo';
import { CashRankedPrize, PrizeType, RankedPrize } from '../../prize';
import { Tournament } from '../tournament';
import { TournamentLeaderboardMode } from '../tournament-leaderboard-mode';
import { TournamentState } from '../tournament-state';
import { TournamentLifecycleActionResult } from './tournament-lifecycle-action-result';
import { TournamentLifecycleManager } from './tournament-lifecycle-manager';

@Singleton
@LogClass()
export class HiLoTournamentLifecycleManager implements TournamentLifecycleManager {
    constructor(
        @Inject private readonly gameManager: GameManager,
        @Inject private readonly client: HiloClient) {
    }

    public async launch(tournament: Tournament): Promise<TournamentLifecycleActionResult> {
        const newEndTime = tournament.endTime ? moment(tournament.endTime).add(5, 'minutes').toDate() : moment(tournament.startTime).add(2, 'hours').toDate();

        if (tournament.state !== TournamentState.Scheduled)
            return {
                endTime: newEndTime,
                nextState: tournament.state
            };

        Logger.info(`Getting game ${tournament.gameId}...`);
        const game = await this.gameManager.get(tournament.gameId);

        if (!game)
            throw new Error(`Game ${tournament.gameId} not found.`);

        const request = this.getCreateLobbyRequest(tournament, game);
        Logger.info(`Creating Game...`, request);
        await this.client.createGame(request);
        Logger.info(`Game Created`);
        Logger.info(`Launching game...`);
        await this.client.launchGame(request.gameId);
        Logger.info(`Game Launched`);

        Logger.info(`Rescheduling tournament end time for ${newEndTime}`);

        return {
            endTime: newEndTime,
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

        const game = await this.client.getGame(tournament.id);

        if (game.state === GameState.Cancelled) {
            Logger.error('HiLo game is in a cancelled state, cancelling tournament...');
            return {
                nextState: TournamentState.Cancelled,
                stop: true
            };
        }

        if (game.state < GameState.Waiting)
            throw new Error(`HiLo game ${tournament.id} is not in a running state, aborting.`);

        Logger.info('HiLo game is running...');

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

    private getCreateLobbyRequest(tournament: Tournament, game: Game): CreateLobbyRequest {
        let prizeAmount = tournament.prizeTotal || 0;

        if (tournament.prizes.length > 0) {
            const prize = tournament.prizes[0] as RankedPrize;

            if (prize.type === PrizeType.Cash)
                prizeAmount = prize.amount;

            if (prize.type === PrizeType.Tangible)
                prizeAmount = 0;
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

        const gameMetadata = {
            ...game.metadata,
            ...tournament.gameMetadataOverride
        };

        if (gameMetadata) {
            if (gameMetadata.minNumber)
                config.minNumber = gameMetadata.minNumber;
            if (gameMetadata.maxNumber)
                config.maxNumber = gameMetadata.maxNumber;
            if (gameMetadata.testMode)
                config.testMode = gameMetadata.testMode;
            if (gameMetadata.roundDuration)
                config.roundDuration = gameMetadata.roundDuration;
            if (gameMetadata.cutOffTime)
                config.cutOffTime = gameMetadata.cutOffTime;

            switch (gameMetadata.mode) {
                default:
                    if (gameMetadata.maxWinners)
                        config.maxWinners = gameMetadata.maxWinners;
                    if (gameMetadata.maxRounds)
                        config.maxRounds = gameMetadata.maxRounds;
                    break;

                case GameMode.Leaderboard:
                    if (tournament.leaderboardMode === TournamentLeaderboardMode.Disabled)
                        throw new Error('Tournament leaderboard must not be disabled.');

                    config.mode = GameMode.Leaderboard;
                    config.prizeAmount = tournament.prizeTotal || prizeAmount;
                    config.livesPerEntry = gameMetadata.livesPerEntry || 1;

                    if (tournament.metadata?.pointsPerRound)
                        config.pointsPerRound = tournament.metadata.pointsPerRound;

                    if (!tournament.endTime)
                        throw new Error('Tournament must have an end time for this hilo game mode.');

                    config.endTime = moment(tournament.endTime).unix();
                    break;

                case GameMode.Perpetual:
                    config.mode = GameMode.Perpetual;
                    config.prizeAmount = tournament.prizeTotal || prizeAmount;
                    config.livesPerEntry = gameMetadata.livesPerEntry || 1;

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
                    config.chips = gameMetadata.chips || [10, 25, 50, 75, 100];
                    config.multipliers = gameMetadata.multipliers || [1, 9, 2, 10, 6, 5, 10, 4, 7, 10, 3, 8];
                    config.livesPerEntry = gameMetadata.livesPerEntry || 1;

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