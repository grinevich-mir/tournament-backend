import { Engine, Ignition } from '@tcom/tournament-engine-core';
import { Provides, Inject } from '@tcom/platform/lib/core/ioc';
import { TambolaClient, CreateLobbyRequest, LobbyPrizesConfig, LobbyConfig } from '@tcom/platform/lib/integration/tambola';
import moment from 'moment';
import { Scheduler } from '@tcom/tournament-engine-core/lib/scheduler';
import { TournamentRoundResult } from '@tcom/platform/lib/tournament';
import _ from 'lodash';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { PrizeType, CashPrize } from '@tcom/platform/lib/prize';

@Provides(Engine)
@LogClass()
export class BingoEngine extends Engine {
    public name = 'bingo';

    constructor(
        @Inject private readonly client: TambolaClient,
        @Inject private readonly scheduler: Scheduler) {
            super();
        }

    public async init(): Promise<void> {
        Logger.info('Bingo Engine: Init');
        const request = await this.getCreateLobbyRequest();
        Logger.info('Bingo Engine: Creating lobby:', JSON.stringify(request));
        await this.client.createGame(request);
        Logger.info('Bingo Engine: Lobby created.');
    }

    public async start(): Promise<void> {
        Logger.info('Bingo Engine: Start');

        // If the game has no end time, force cancellation after 10 minutes.
        if (!this.manager.tournament.endTime)
            this.scheduler.schedule('End', moment().utc().add(10, 'minutes').toDate(), () => this.manager.cancel());
    }

    public async cancel(): Promise<void> {
        Logger.info('Bingo Engine: Cancel');

        // TODO: Cancel Tambola game
    }

    public async complete(): Promise<void> {
        Logger.info('Bingo Engine: Complete');
    }

    public async shutdown(): Promise<void> {
        Logger.info('Bingo Engine: Shutdown');
    }

    public async roundResults(results: TournamentRoundResult[]): Promise<void> {
        Logger.info('Bingo Engine: Round Results', results);
        await this.manager.finalise();
    }

    private async getCreateLobbyRequest(): Promise<CreateLobbyRequest> {
        const tournament = this.manager.tournament;
        const game = this.manager.game;
        let balls: 90 | 75 = 90;

        if (game.metadata && game.metadata.balls)
            balls = game.metadata.balls;

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
            ticketPrice: 10,
            startTime: moment(tournament.startTime).toISOString(),
            prizes: await this.mapPrizes(balls)
        };

        if (game.metadata) {
            if (game.metadata.mode)
                config.mode = game.metadata.mode;
            if (game.metadata.freeTickets)
                config.freeTickets = game.metadata.freeTickets;
            if (game.metadata.ticketPrice)
                config.ticketPrice = game.metadata.ticketPrice;
            if (game.metadata.minTicketsPerPlayer)
                config.minTicketsPerPlayer = game.metadata.minTicketsPerPlayer;
            if (game.metadata.maxTicketsPerPlayer)
                config.ticketPrice = game.metadata.maxTicketsPerPlayer;
            if (game.metadata.callFrequencySeconds)
                config.callFrequencySeconds = game.metadata.callFrequencySeconds;
        }

        return {
            gameId: tournament.id.toString(),
            config
        };
    }

    private async mapPrizes(balls: 90 | 75): Promise<LobbyPrizesConfig> {
        switch (balls) {
            default:
                return this.map90BallPrizes();

            case 75:
                return this.map75BallPrizes();
        }
    }

    private async map90BallPrizes(): Promise<LobbyPrizesConfig> {
        const tournament = this.manager.tournament;
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

    private async map75BallPrizes(): Promise<LobbyPrizesConfig> {
        const tournament = this.manager.tournament;
        const game = this.manager.game;
        const fullHouse = tournament.prizes.find(p => p.startRank === 1) as CashPrize;

        if (!fullHouse)
            throw new Error(`Full House (rank 1) prize missing.`);

        if (fullHouse.type !== PrizeType.Cash)
            throw new Error('All tournament prizes must be Cash type.');

        let pattern: string | undefined;

        if (game.metadata && game.metadata.pattern)
            pattern = game.metadata.pattern;
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

Ignition.start().catch(err => { throw err; });