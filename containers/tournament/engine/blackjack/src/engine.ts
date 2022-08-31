import { Engine, Ignition } from '@tcom/tournament-engine-core';
import { Provides, Inject } from '@tcom/platform/lib/core/ioc';
import { Scheduler } from '@tcom/tournament-engine-core/lib/scheduler';
import { TournamentRoundResult } from '@tcom/platform/lib/tournament';
import moment from 'moment';
import { BlackjackClient, CreateLobbyRequest, LobbyConfig, GameState } from '@tcom/platform/lib/integration/blackjack';
import { PrizeType, CashRankedPrize } from '@tcom/platform/lib/prize';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import _ from 'lodash';

@Provides(Engine)
@LogClass()
export class BlackjackEngine extends Engine {
    public name = 'blackjack';

    constructor(
        @Inject private readonly client: BlackjackClient,
        @Inject private readonly scheduler: Scheduler) {
        super();
    }

    public async init(): Promise<void> {
        Logger.info('Blackjack Engine: Init');
        const request = this.getCreateLobbyRequest();
        Logger.info('Blackjack Engine: Creating lobby:', request);
        await this.client.createGame(request);
        Logger.info('Blackjack Engine: Lobby created.');
        await this.client.launchGame(request.gameId);
        Logger.info('Blackjack Engine: Game launch started.');
    }

    public async start(): Promise<void> {
        Logger.info('Blackjack Engine: Start');

        if (!this.manager.tournament.endTime)
            this.scheduler.schedule('cancel', moment().utc().add(2, 'hours').toDate(), () => this.manager.cancel());
        else
            this.scheduler.schedule('end', moment(this.manager.tournament.endTime).utc().add(2, 'hours').toDate(), () => this.manager.finalise());

        const game = await this.client.getGame(this.manager.tournamentId);

        if (game.state === GameState.Cancelled) {
            Logger.info('Blackjack game is in a cancelled state, wait for call from RGS to cancel tournament, or cancel in 5 minutes.');
            this.scheduler.schedule('cancel', moment().utc().add(5, 'minutes').toDate(), () => this.manager.cancel());
            return;
        }

        if (game.state < GameState.Waiting)
            throw new Error(`Blackjack game ${this.manager.tournamentId} is not in a running state, aborting.`);

        Logger.info('Blackjack game is running...');
    }

    public async cancel(): Promise<void> {
        Logger.info('Blackjack Engine: Cancel');
    }

    public async complete(): Promise<void> {
        Logger.info('Blackjack Engine: Complete');
    }

    public async shutdown(): Promise<void> {
        Logger.info('Blackjack Engine: Shutdown');
    }

    public async roundResults(results: TournamentRoundResult[]): Promise<void> {
        Logger.info('Blackjack Engine: Round Results', results);
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
            roundDuration: 75,
            betDuration: 20,
            playDuration: 40,
            padDuration: 15,
            cutOffTime: 5
        };

        if (tournament.endTime)
            config.endTime = moment(tournament.endTime).unix();

        if (game.metadata) {
            if (game.metadata.roundDuration)
                config.roundDuration = game.metadata.roundDuration;
            if (game.metadata.betDuration)
                config.betDuration = game.metadata.betDuration;
            if (game.metadata.playDuration)
                config.playDuration = game.metadata.playDuration;
            if (game.metadata.padDuration !== undefined)
                config.padDuration = game.metadata.padDuration;
            if (game.metadata.cutOffTime)
                config.cutOffTime = game.metadata.cutOffTime;
            if (game.metadata.maxRounds)
                config.maxRounds = game.metadata.maxRounds;
            if (game.metadata.startBalance)
                config.startBalance = game.metadata.startBalance;
            if (game.metadata.cardDecks)
                config.cardDecks = game.metadata.cardDecks;
        }

        return {
            gameId: tournament.id.toString(),
            config
        };
    }
}

Ignition.start().catch(err => { throw err; });
