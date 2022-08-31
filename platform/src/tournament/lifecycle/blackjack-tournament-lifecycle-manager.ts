import _ from 'lodash';
import moment from 'moment';
import { Inject, Singleton } from '../../core/ioc';
import Logger, { LogClass } from '../../core/logging';
import { Game, GameManager } from '../../game';
import { BlackjackClient, CreateLobbyRequest, GameState, LobbyConfig } from '../../integration/blackjack';
import { PrizeType, RankedPrize } from '../../prize';
import { Tournament } from '../tournament';
import { TournamentState } from '../tournament-state';
import { TournamentLifecycleActionResult } from './tournament-lifecycle-action-result';
import { TournamentLifecycleManager } from './tournament-lifecycle-manager';

@Singleton
@LogClass()
export class BlackjackTournamentLifecycleManager implements TournamentLifecycleManager {
    constructor(
        @Inject private readonly gameManager: GameManager,
        @Inject private readonly client: BlackjackClient) {
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

        const request = this.getCreateLobbyRequest(tournament, game);
        Logger.info(`Creating Game...`, request);
        await this.client.createGame(request);
        Logger.info(`Game Created`);
        Logger.info(`Launching game...`);
        await this.client.launchGame(request.gameId);
        Logger.info(`Game Launched`);

        const newEndTime = tournament.endTime ? moment(tournament.endTime).add(5, 'minutes').toDate() : moment(tournament.startTime).add(2, 'hours').toDate();
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
            Logger.error('Blackjack game is in a cancelled state, cancelling tournament...');
            return {
                nextState: TournamentState.Cancelled,
                stop: true
            };
        }

        if (game.state < GameState.Waiting)
            throw new Error(`Blackjack game ${tournament.id} is not in a running state, aborting.`);

        Logger.info('Blackjack game is running...');


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
            name: tournament.name,
            prizeAmount,
            currency: tournament.currencyCode,
            minPlayerCount: tournament.minPlayers,
            maxPlayerCount: tournament.maxPlayers,
            startTime: moment(tournament.startTime).unix(),
            roundDuration: 75,
            betDuration: 20,
            playDuration: 40,
            padDuration: 15,
            cutOffTime: 5
        };

        if (tournament.endTime)
            config.endTime = moment(tournament.endTime).unix();

        const gameMetadata = {
            ...game.metadata,
            ...tournament.gameMetadataOverride
        };

        if (gameMetadata) {
            if (gameMetadata.roundDuration)
                config.roundDuration = gameMetadata.roundDuration;
            if (gameMetadata.betDuration)
                config.betDuration = gameMetadata.betDuration;
            if (gameMetadata.playDuration)
                config.playDuration = gameMetadata.playDuration;
            if (gameMetadata.padDuration !== undefined)
                config.padDuration = gameMetadata.padDuration;
            if (gameMetadata.cutOffTime)
                config.cutOffTime = gameMetadata.cutOffTime;
            if (gameMetadata.maxRounds)
                config.maxRounds = gameMetadata.maxRounds;
            if (gameMetadata.startBalance)
                config.startBalance = gameMetadata.startBalance;
            if (gameMetadata.cardDecks)
                config.cardDecks = gameMetadata.cardDecks;
        }

        return {
            gameId: tournament.id.toString(),
            config
        };
    }
}