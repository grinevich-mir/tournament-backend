import _ from 'lodash';
import moment from 'moment';
import { Inject, Singleton } from '../../core/ioc';
import Logger, { LogClass } from '../../core/logging';
import { Game, GameManager } from '../../game';
import { CreateLobbyRequest, LobbyConfig, LobbyPrizesConfig, TambolaClient } from '../../integration/tambola';
import { CashPrize, PrizeType } from '../../prize';
import { Tournament } from '../tournament';
import { TournamentState } from '../tournament-state';
import { TournamentLifecycleActionResult } from './tournament-lifecycle-action-result';
import { TournamentLifecycleManager } from './tournament-lifecycle-manager';

@Singleton
@LogClass()
export class BingoTournamentLifecycleManager implements TournamentLifecycleManager {
    constructor(
        @Inject private readonly gameManager: GameManager,
        @Inject private readonly client: TambolaClient) {
    }

    public async launch(tournament: Tournament): Promise<TournamentLifecycleActionResult> {
        if (tournament.state !== TournamentState.Scheduled)
            return {
                nextState: tournament.state
            };

        Logger.info(`Getting game ${tournament.gameId}...`);
        const game = await this.gameManager.get(tournament.gameId);

        if (!game)
            throw new Error(`Game ${tournament.gameId} not found.`);

        const request = await this.getCreateLobbyRequest(tournament, game);
        Logger.info(`Creating Game...`, request);
        await this.client.createGame(request);
        Logger.info(`Game Created`);

        const newEndTime = tournament.endTime ? moment(tournament.endTime).add(5, 'minutes').toDate() : moment(tournament.startTime).add(20, 'minutes').toDate();
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

    private async getCreateLobbyRequest(tournament: Tournament, game: Game): Promise<CreateLobbyRequest> {
        let balls: 90 | 75 = 90;

        const gameMetadata = {
            ...game.metadata,
            ...tournament.gameMetadataOverride
        };

        if (gameMetadata && gameMetadata.balls)
            balls = gameMetadata.balls;

        const config: LobbyConfig = {
            currency_iso: tournament.currencyCode,
            name: tournament.name,
            type: balls === 90 ? 0 : 1,
            callFrequencySeconds: 4,
            minPlayers: tournament.minPlayers,
            maxPlayers: tournament.maxPlayers,
            freeTickets: 8,
            mode: 0,
            minTicketsPerPlayer: 1,
            maxTicketsPerPlayer: 8,
            ticketPrice: 0.10,
            startTime: moment(tournament.startTime).toISOString(),
            prizes: await this.mapPrizes(tournament, game, balls)
        };

        if (gameMetadata) {
            if (gameMetadata.mode)
                config.mode = gameMetadata.mode;
            if (gameMetadata.freeTickets)
                config.freeTickets = gameMetadata.freeTickets;
            if (gameMetadata.ticketPrice)
                config.ticketPrice = gameMetadata.ticketPrice;
            if (gameMetadata.minTicketsPerPlayer)
                config.minTicketsPerPlayer = gameMetadata.minTicketsPerPlayer;
            if (gameMetadata.maxTicketsPerPlayer)
                config.ticketPrice = gameMetadata.maxTicketsPerPlayer;
            if (gameMetadata.callFrequencySeconds)
                config.callFrequencySeconds = gameMetadata.callFrequencySeconds;
        }

        return {
            gameId: tournament.id.toString(),
            config
        };
    }

    private async mapPrizes(tournament: Tournament, game: Game, balls: 90 | 75): Promise<LobbyPrizesConfig> {
        switch (balls) {
            default:
                return this.map90BallPrizes(tournament, game);

            case 75:
                return this.map75BallPrizes(tournament, game);
        }
    }

    private async map90BallPrizes(tournament: Tournament, game: Game): Promise<LobbyPrizesConfig> {
        const fullHouse = tournament.prizes.find(p => p.startRank === 1) as CashPrize;
        const twoLines = tournament.prizes.find(p => p.startRank === 2) as CashPrize;
        const oneLine = tournament.prizes.find(p => p.startRank === 3) as CashPrize;

        if (!fullHouse)
            throw new Error(`Full House (rank 1) prize missing.`);

        if (!twoLines)
            throw new Error(`Two Lines (rank 2) prize missing.`);

        if (!oneLine)
            throw new Error(`One Line (rank 3) prize missing.`);

        if ([fullHouse, twoLines, oneLine].some(p => p.type !== PrizeType.Cash))
            throw new Error('All tournament prizes must be Cash type.');

        return {
            'Full House': fullHouse.amount * 100,
            'Two-Line Bingo': twoLines.amount * 100,
            'One-Line Bingo': oneLine.amount * 100
        };
    }

    private async map75BallPrizes(tournament: Tournament, game: Game): Promise<LobbyPrizesConfig> {
        const gameMetadata = {
            ...game.metadata,
            ...tournament.gameMetadataOverride
        };

        const fullHouse = tournament.prizes.find(p => p.startRank === 1) as CashPrize;

        if (!fullHouse)
            throw new Error(`Full House (rank 1) prize missing.`);

        if (fullHouse.type !== PrizeType.Cash)
            throw new Error('All tournament prizes must be Cash type.');

        let pattern: string | undefined;

        if (gameMetadata && gameMetadata.pattern)
            pattern = gameMetadata.pattern;
        else
            pattern = await this.getRandomPatternName();

        if (!pattern)
            pattern = 'Full House';

        Logger.info(`Using pattern: '${pattern}'`);

        const config: LobbyPrizesConfig = {};

        config[pattern] = fullHouse.amount * 100;

        return config;
    }

    private async getRandomPatternName(): Promise<string> {
        const patterns = await this.client.getPatterns();

        if (!patterns)
            return 'Full House';

        const names = Object.keys(patterns);

        Logger.info(`Available Patterns: ${JSON.stringify(names)}`);
        return _.sample(Object.keys(patterns)) as string;
    }
}