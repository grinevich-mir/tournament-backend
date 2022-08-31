import { Get, Route, Tags, ClientController, Path, Query, Hidden, HtmlResult } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NotFoundError } from '@tcom/platform/lib/core/errors';
import { TournamentEntryManager, TournamentManager } from '@tcom/platform/lib/tournament';
import { GameSessionManager, GameManager, GameSessionStatus } from '@tcom/platform/lib/game';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { Config, DeviceType, URLBuilder } from '@tcom/platform/lib/core';
import { NewGameSession } from '@tcom/platform/lib/game';

@Tags('Active Tournaments')
@Route('tournament/launch')
@LogClass()
export class LaunchController extends ClientController {
    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly gameManager: GameManager,
        @Inject private readonly gameSessionManager: GameSessionManager) {
        super();
    }

    /**
     * @summary Launches a tournament game
     */
    @Hidden()
    @Get('{token}')
    public async launch(@Path() token: string, @Query() deviceType?: DeviceType): Promise<HtmlResult> {
        try {
            const entry = await this.tournamentEntryManager.getByToken(token);

            if (!entry)
                throw new NotFoundError('Entry not found');

            /*if (entry.allocations.length === 0 || entry.allocations.every(a => a.complete))
                throw new ForbiddenError('No unused allocations remaining');*/

            const tournament = await this.tournamentManager.get(entry.tournamentId);

            if (!tournament)
                throw new NotFoundError('Tournament not found');

            const game = await this.gameManager.get(tournament.gameId);

            if (!game)
                throw new NotFoundError(`Game ${tournament.gameId} not found`);

            const sessionRef = `TE:${entry.id}`;
            let session = await this.gameSessionManager.getByReference(sessionRef, {
                currencyCode: tournament.currencyCode,
                statuses: [GameSessionStatus.Created],
                expired: false
            });

            if (!session) {
                const newSession: NewGameSession = {
                    gameId: tournament.gameId,
                    provider: game.provider,
                    userId: entry.userId,
                    currencyCode: tournament.currencyCode,
                    language: 'en', // TODO: NEED TO GET THIS FROM SOMEWHERE
                    reference: sessionRef,
                    metadata: {
                        tournamentId: tournament.id,
                        entryId: entry.id
                    }
                };

                session = await this.gameSessionManager.add(newSession);
            }

            const url = new URLBuilder(`https://api.${Config.domain}/game/play/${session.secureId}`);

            if (deviceType)
                url.setQueryParam('deviceType', deviceType);

            return this.html('static/redirect.html', {
                url: url.toString()
            });
        } catch (err) {
            Logger.error(err);
            this.setStatus(err.status || 500);
            return this.html('static/error.html', err);
        }
    }
}
