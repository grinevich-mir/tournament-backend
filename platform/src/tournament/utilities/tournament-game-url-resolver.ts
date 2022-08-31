import { Singleton, Inject } from '../../core/ioc';
import { ParameterStore, Config, DeviceType, URLBuilder } from '../../core';
import { GameType, GameManager, Game } from '../../game';
import { TournamentEntry } from '../tournament-entry';
import { Tournament } from '../tournament';
import { LogClass } from '../../core/logging';

// NOTE: should be in aggregated game launcher
@Singleton
@LogClass()
export class TournamentGameUrlResolver {
    constructor(
        @Inject private readonly parameterStore: ParameterStore,
        @Inject private readonly gameManager: GameManager) {
        }

    public async resolve(tournament: Tournament, entry: TournamentEntry, deviceType?: DeviceType): Promise<string> {
        const game = await this.gameManager.get(tournament.gameId);

        if (!game)
            throw new Error(`Game ${tournament.gameId} not found.`);

        switch (game.type) {
            case GameType.Hilo:
                return this.resolveHiLo(tournament, game, entry);

            case GameType.Bingo:
                return this.resolveBingo(tournament, game, entry);

            case GameType.Blackjack:
                return this.resolveBlackjack(tournament, game, entry);

            case GameType.Crash:
                return this.resolveCrash(tournament, game, entry);

            default:
                return this.resolveLauncher(entry, deviceType);
        }
    }

    private async resolveHiLo(tournament: Tournament, game: Game, entry: TournamentEntry): Promise<string> {
        const operatorKey = await this.parameterStore.get(`/${Config.stage}/integration/hilo/operator-key`, false, true);
        let host = await this.parameterStore.get(`/${Config.stage}/integration/hilo/games-host`, false, true);

        const metadata = {
            ...game.metadata,
            ...tournament.gameMetadataOverride
        };

        if (metadata.gameLocation)
            host = metadata.gameLocation;

        const url = new URLBuilder(`https://${host}`);
        url.setQueryParams({
            operator: operatorKey,
            token: entry.token,
            gameId: tournament.id
        });

        if (metadata?.externalControlSupport === true)
            url.setQueryParam('controlsEnabled', 'false');

        return url.toString();
    }

    private async resolveBingo(tournament: Tournament, game: Game, entry: TournamentEntry): Promise<string> {
        const operatorKey = await this.parameterStore.get(`/${Config.stage}/integration/tambola/operator-key`, false, true);
        const host = await this.parameterStore.get(`/${Config.stage}/integration/tambola/api-host`);
        let gameLocation = `game1.${Config.stage}.bingo.tgaming.io`;

        const metadata = {
            ...game.metadata,
            ...tournament.gameMetadataOverride
        };

        if (metadata.gameLocation)
            gameLocation = metadata.gameLocation;

        const gameLocationBuilder = new URLBuilder(`https://${gameLocation}`);

        if (metadata?.externalControlSupport === true)
            gameLocationBuilder.setQueryParam('controlsEnabled', 'false');

        return `https://${host}/v1/bingoLauncher?operator=${operatorKey}&auth_token=${entry.token}&game_id=${tournament.id}&redirect=${encodeURIComponent(gameLocationBuilder.toString())}`;
    }

    private async resolveBlackjack(tournament: Tournament, game: Game, entry: TournamentEntry): Promise<string> {
        const operatorKey = await this.parameterStore.get(`/${Config.stage}/integration/blackjack/operator-key`, false, true);
        let host = await this.parameterStore.get(`/${Config.stage}/integration/blackjack/games-host`, false, true);

        const metadata = {
            ...game.metadata,
            ...tournament.gameMetadataOverride
        };

        if (metadata.gameLocation)
            host = metadata.gameLocation;

        const url = new URLBuilder(`https://${host}`);
        url.setQueryParams({
            operator: operatorKey,
            token: entry.token,
            gameId: tournament.id
        });

        if (metadata?.externalControlSupport === true)
            url.setQueryParam('controlsEnabled', 'false');

        return url.toString();
    }

    private async resolveCrash(tournament: Tournament, game: Game, entry: TournamentEntry): Promise<string> {
        const operatorKey = await this.parameterStore.get(`/${Config.stage}/integration/crash/operator-key`, false, true);
        let host = await this.parameterStore.get(`/${Config.stage}/integration/crash/games-host`, false, true);

        const metadata = {
            ...game.metadata,
            ...tournament.gameMetadataOverride
        };

        if (metadata.gameLocation)
            host = metadata.gameLocation;

        const url = new URLBuilder(`https://${host}`);
        url.setQueryParams({
            operator: operatorKey,
            token: entry.token,
            gameId: tournament.id
        });

        if (metadata?.externalControlSupport === true)
            url.setQueryParam('controlsEnabled', 'false');

        return url.toString();
    }

    private resolveLauncher(entry: TournamentEntry, deviceType?: DeviceType): string {
        const url = new URLBuilder(`https://api.${Config.domain}/tournament/launch/${entry.token}`);

        if (deviceType)
            url.setQueryParam('deviceType', deviceType);

        return url.toString();
    }
}