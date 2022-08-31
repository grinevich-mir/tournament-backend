import { Get, Route, Security, Tags, ClientController, Response } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { BadRequestError, NotFoundError } from '@tcom/platform/lib/core';
import { TournamentIntroModel, TournamentModelMapper } from '@tcom/platform/lib/tournament/models';
import { TournamentIntroManager, TournamentManager, TournamentEntryManager } from '@tcom/platform/lib/tournament';
import { TournamentIntroCompiler } from '@tcom/platform/lib/tournament/utilities';

@Tags('Tournament Intros')
@Route('tournament')
@LogClass()
export class IntroController extends ClientController {
    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly tournamentModelMapper: TournamentModelMapper,
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly tournamentIntroManager: TournamentIntroManager,
        @Inject private readonly tournamentIntroCompiler: TournamentIntroCompiler) {
        super();
    }

    /**
     * @summary Gets introductory tournament content
     * @isInt id
     * @param id Tournament ID
     */
    @Get('{id}/intro')
    @Security('cognito')
    @Response<NotFoundError>(404, 'Tournament not found')
    @Response<BadRequestError>(400, 'Missing tournament intro ID')
    public async getByTournamentId(id: number): Promise<TournamentIntroModel> {
        const tournament = await this.tournamentManager.get(id);

        if (!tournament)
            throw new NotFoundError('Tournament not found');

        if (!tournament.introId)
            throw new BadRequestError('Missing tournament intro ID');

        const intro = await this.tournamentIntroManager.getActive(tournament.introId);
        const entry = await this.tournamentEntryManager.get(id, this.user.id);
        const userTournament = await this.tournamentModelMapper.mapForUser(tournament);

        this.tournamentModelMapper.mapAllocationInfo(userTournament, entry);

        return this.tournamentIntroCompiler.compile(intro, {
            user: this.user,
            tournament: userTournament,
            tournamentEntry: entry
        });
    }
}
