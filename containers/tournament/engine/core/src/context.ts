import * as env from 'env-var';
import { Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { TournamentManager, Tournament } from '@tcom/platform/lib/tournament';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { Game, GameManager } from '@tcom/platform/lib/game';

@Singleton
@LogClass()
export class Context {
    private _tournament!: Tournament;
    private _game!: Game;

    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly gameManager: GameManager) {
    }

    public get tournamentId(): number {
        return env.get('TOURNAMENT_ID').required().asInt();
    }

    public get tournament(): Tournament {
        return this._tournament;
    }

    public get game(): Game {
        return this._game;
    }

    public async updateTournament(): Promise<void> {
        Logger.info(`Getting tournament...`);
        this._tournament = await this.tournamentManager.get(this.tournamentId) as Tournament;
    }

    public async updateGame(): Promise<void> {
        if (!this._tournament)
            return;

        Logger.info('Getting game...');
        this._game = await this.gameManager.get(this._tournament.gameId) as Game;

        if (this._tournament.gameMetadataOverride)
            this._game.metadata = {
                ...this._game.metadata,
                ...this._tournament.gameMetadataOverride
            };
    }
}