import { Get, Query, Route, Security, Tags, Path, Response, ClientController } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NotFoundError } from '@tcom/platform/lib/core/errors';
import { TournamentState, TournamentFilter, TournamentManager, TournamentEntryManager } from '@tcom/platform/lib/tournament';
import { TournamentModel, TournamentModelMapper, TournamentEntryModel, UserTournamentModel } from '@tcom/platform/lib/tournament/models';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { PagedResult } from '@tcom/platform/lib/core';

@Tags('Historic Tournaments')
@Route('tournament/history')
@LogClass()
export class HistoryController extends ClientController {
    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly mapper: TournamentModelMapper) {
            super();
    }

    /**
     * @summary Gets all historic tournaments for the authenticated user
     * @isInt id
     * @isInt skip
     * @isInt take
     * @maximum take 20
     */
    @Get('me')
    @Security('cognito')
    public async getAllForUser(@Query()page: number = 1, @Query()pageSize: number = 20): Promise<PagedResult<UserTournamentModel>> {
        if (pageSize > 20)
            pageSize = 20;

        const filter: TournamentFilter = {
            page,
            pageSize,
            enabled: true,
            states: [TournamentState.Ended, TournamentState.Cancelled],
            order: {
                startTime: 'DESC'
            }
        };

        const result = await this.tournamentManager.getAllForUser(this.user.id, filter);
        const models = await this.mapper.mapAllForUser(result.items);
        return new PagedResult(models, result.totalCount, result.page, result.pageSize);
    }

    /**
     * @summary Gets a historic tournament
     * @isInt id
     * @param id Tournament ID
     */
    @Get('{id}')
    @Security('cognito', ['anonymous'])
    @Response<NotFoundError>(404, 'Tournament not found.')
    public async get(@Path() id: number): Promise<TournamentModel> {
        const tournament = await this.tournamentManager.get(id);

        if (!tournament)
            throw new NotFoundError('Tournament not found');

        return this.mapper.map(tournament);
    }

    /**
     * @summary Gets the authenticated users entry for the specified tournament
     * @isInt id
     * @param id Tournament ID
     */
    @Get('{id}/entry')
    @Security('cognito')
    @Response<NotFoundError>('Entry not found.')
    public async getUserEntry(@Path() id: number): Promise<TournamentEntryModel> {
        const entry = await this.tournamentEntryManager.get(id, this.user.id);

        if (!entry)
            throw new NotFoundError('Entry not found');

        return this.mapper.mapEntry(entry);
    }
}
