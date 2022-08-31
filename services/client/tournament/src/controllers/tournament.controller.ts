import { Example, Get, Post, Route, Security, Tags, ClientController, Path, Body } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { TournamentLaunchInfoModel, TournamentModelMapper, TournamentEntryModel, UserTournamentModel } from '@tcom/platform/lib/tournament/models';
import { NotFoundError, ForbiddenError } from '@tcom/platform/lib/core/errors';
import { TournamentEntryManager, TournamentManager, TournamentState } from '@tcom/platform/lib/tournament';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { JoinTournamentModel } from '../models';
import { TournamentLaunchInfoResolver } from '@tcom/platform/lib/tournament/utilities';
import { UserType } from '@tcom/platform/lib/user';
import { Jackpot, JackpotManager } from '@tcom/platform/lib/jackpot';
import _ from 'lodash';

@Tags('Active Tournaments')
@Route('tournament')
@LogClass()
export class TournamentController extends ClientController {
    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly mapper: TournamentModelMapper,
        @Inject private readonly launchInfoResolver: TournamentLaunchInfoResolver,
        @Inject private readonly jackpotManager: JackpotManager) {
        super();
    }

    /**
     * @summary Gets all active tournaments
     */
    @Get()
    @Security('cognito', ['anonymous'])
    public async getAll(): Promise<UserTournamentModel[]> {
        let tournaments = await this.tournamentManager.getActive();

        if (!this.user || this.user.type === UserType.Standard)
            tournaments = tournaments.filter(t => t.public);

        let models = await this.mapper.mapAll(tournaments) as UserTournamentModel[];

        for (const model of models) {
            const entry = this.user ? await this.tournamentEntryManager.get(model.id, this.user.id, true) : undefined;
            this.mapper.mapAllocationInfo(model, entry);
        }

        if (this.user?.type === UserType.Standard)
            models = models.filter(m => m.playerJoined || (m.maxLevel === undefined || m.maxLevel === null || this.user.level <= m.maxLevel));

        return models;
    }


    /**
     * @summary Gets the jackpots for the active tournaments
     */
    @Get('jackpot')
    public async getJackpots(): Promise<Jackpot[]> {
        const tournaments = await this.tournamentManager.getActive();

        if (tournaments.length === 0)
            return[];

        const jackpotTournaments = tournaments.filter(t => t.jackpotTriggers.length > 0);

        if (jackpotTournaments.length === 0)
            return [];

        const jackpotIds = _.chain(jackpotTournaments)
            .filter(t => t.enabled)
            .flatMap(t => t.jackpotTriggers.map(j => j.jackpotId))
            .uniq()
            .value();

        const jackpots = await this.jackpotManager.getMany(...jackpotIds);
        return jackpots.filter(j => j.enabled);
    }

    /**
     * @summary Gets the jackpots for the specified tournament
     */
    @Get('{id}/jackpot')
    public async getJackpotsForTournament(@Path() id: number): Promise<Jackpot[]> {
        const tournament = await this.tournamentManager.get(id);

        if (!tournament)
            throw new NotFoundError('Tournament not found.');

        if (tournament.jackpotTriggers.length === 0)
            return [];

        const jackpotIds = tournament.jackpotTriggers.filter(t => t.enabled).map(j => j.jackpotId);

        if (jackpotIds.length === 0)
            return [];

        const jackpots = await this.jackpotManager.getMany(...jackpotIds);
        return jackpots.filter(j => j.enabled);
    }

    /**
     * @summary Gets an active tournament by ID
     * @isInt id
     */
    @Get('{id}')
    @Security('cognito', ['anonymous'])
    public async getById(id: number): Promise<UserTournamentModel> {
        const tournament = await this.tournamentManager.get(id);

        if (!tournament || (this.user?.type === UserType.Standard && !tournament.public))
            throw new NotFoundError('Tournament not found');

        const model = await this.mapper.map(tournament) as UserTournamentModel;

        if (this.user) {
            if (this.user.type === UserType.Standard &&
                !model.playerJoined &&
                model.maxLevel !== undefined &&
                model.maxLevel !== null &&
                this.user.level > model.maxLevel)
                throw new NotFoundError('Tournament not found');

            const entry = await this.tournamentEntryManager.get(model.id, this.user.id, true);
            this.mapper.mapAllocationInfo(model, entry);
        }

        return model;
    }

    /**
     * @summary Gets the authenticated users entry for an active tournament
     * @param id Tournament ID
     */
    @Get('{id}/entry')
    @Security('cognito')
    public async getEntry(id: number): Promise<TournamentEntryModel> {
        const entry = await this.tournamentEntryManager.get(id, this.user.id, true);

        if (!entry)
            throw new NotFoundError('Tournament entry not found.');

        return this.mapper.mapEntry(entry);
    }

    /**
     * @summary Enter the authenticated user into an active tournament, returns launch info if already entered
     * @param id Tournament ID
     */
    @Post('{id}/entry')
    @Security('cognito')
    @Example<TournamentLaunchInfoModel>({
        tournamentId: 52,
        type: 'webview',
        location: 'https://launch.tgaming.io/tournament/52?token=dfve5EDFRdfDf',
        chatChannel: 'Tournament_52'
    })
    public async join(@Path() id: number, @Body() info?: JoinTournamentModel): Promise<TournamentLaunchInfoModel> {
        const tournament = await this.tournamentManager.get(id);

        if (!tournament || (this.user.type === UserType.Standard && !tournament.public))
            throw new NotFoundError('Tournament not found.');

        if (tournament.state > TournamentState.Running)
            throw new ForbiddenError('Tournament has ended.');

        let entry = await this.tournamentEntryManager.get(tournament.id, this.user.id);

        if (!entry)
            entry = await this.tournamentEntryManager.add(tournament.id, this.user.id);
        else
            await this.tournamentEntryManager.getOrAddAllocation(tournament, entry);

        const deviceType = info?.deviceType;
        return this.launchInfoResolver.resolve(tournament, entry, deviceType);
    }

    /**
     * @summary Removes the authenticated user from an active tournament
     * @param id Tournament ID
     */
    /*@Delete('{id}/entry')
    @Security('cognito')
    public async unjoin(id: number): Promise<void> {
        await this.tournamentEntryManager.remove(id, this.user.id);
    }*/
}
