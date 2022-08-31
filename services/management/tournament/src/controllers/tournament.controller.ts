import { AdminController, Get, Post, Route, Query, Tags, Path, Security, SuccessResponse, Body, Put, Delete } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { BadRequestError, NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { TournamentStateGroups, TournamentManager, TournamentEntryManager, TournamentFilter, Tournament, TournamentEntry, TournamentUpdate, TournamentRuntimeManager, TournamentState } from '@tcom/platform/lib/tournament';
import moment from 'moment';
import { NewTournamentModel } from '../models';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { RankedPrize } from '@tcom/platform/lib/prize';
import { JackpotTrigger } from '@tcom/platform/lib/jackpot';

@Tags('Tournaments')
@Route('tournament')
@LogClass()
export class TournamentController extends AdminController {
    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly runtimeManager: TournamentRuntimeManager) {
        super();
    }

    /**
     * @summary Get tournaments
     * @isInt page
     * @isInt pageSize
     * @isDateTime completeTimeFrom
     * @isDateTime completeTimeTo
     * @isInt gameId
     * @isInt templateId
     * @isInt playerCountFrom
     * @isInt playerCountTo
     * @pattern playerIds `^\d+(,\d+)*$`
     */
    @Get()
    @Security('admin', ['tournament:read'])
    public async getAll(@Query() type?: string,
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() completeTimeFrom?: Date,
        @Query() completeTimeTo?: Date,
        @Query() gameId?: number,
        @Query() templateId?: number,
        @Query() playerCountFrom?: number,
        @Query() playerCountTo?: number,
        @Query() playerIds?: string
    ): Promise<PagedResult<Tournament>> {

        let filterPlayerIds: number[] = [];

        if (playerIds)
            filterPlayerIds = playerIds.split(',').map(item => {
                return parseInt(item, 10);
            });


        const filter: TournamentFilter = {
            enabled: true,
            page,
            pageSize,
            order: {
                startTime: 'ASC'
            },
            completeTimeFrom,
            completeTimeTo,
            gameId,
            templateId,
            playerCountFrom,
            playerCountTo,
            playerIds: filterPlayerIds
        };

        switch (type) {
            case 'Scheduled':
                filter.states = TournamentStateGroups.Scheduled;
                break;
            case 'Running':
                filter.states = TournamentStateGroups.Running;
                break;
            case 'Ended':
                filter.states = TournamentStateGroups.Ended;
                break;
        }

        return this.tournamentManager.getAll(filter);
    }

    /**
     * @summary Gets tournaments for user
     */
    @Get('user/{userId}')
    @Security('admin', ['tournament:read'])
    public async forUser(
        @Path() userId: number,
        @Query() page: number = 1,
        @Query() pageSize: number = 20,
        @Query() templateId?: number,
        @Query() gameId?: number,
        @Query() states?: TournamentState[],
    ): Promise<PagedResult<Tournament>> {
        const filter: TournamentFilter = {
            page,
            pageSize,
            templateId,
            gameId,
            states,
            order: {
                completeTime: 'DESC',
                endTime: 'DESC',
                startTime: 'DESC'
            }
        };

        return this.tournamentManager.getAllForUser(userId, filter);
    }

    /**
     * @summary Removes user from active tournaments
     */
    @Delete('user/{userId}/entries')
    @Security('admin', ['tournament:delete'])
    public async removeFromActive(@Path() userId: number): Promise<void> {
        const filter: TournamentFilter = {
            states: [
                TournamentState.Scheduled,
                TournamentState.Launching,
                TournamentState.Waiting,
                TournamentState.Running,
            ]
        };

        const { items } = await this.tournamentManager.getAllForUser(userId, filter);

        if (items.length === 0)
            return;

        await Promise.all(items.map((item) => this.tournamentEntryManager.remove(item.id, userId)));
    }

    /**
     * @summary Gets a tournament by ID
     * @isInt id
     */
    @Get('{id}')
    @Security('admin', ['tournament:read'])
    public async get(id: number): Promise<Tournament> {
        const tournament = await this.tournamentManager.get(id);

        if (!tournament)
            throw new NotFoundError('Tournament not found');

        return tournament;
    }

    /**
     * @summary Gets tournament entries
     * @isInt id
     */
    @Get('{id}/entry')
    @Security('admin', ['tournament:read'])
    public async getEntries(id: number): Promise<TournamentEntry[]> {
        const entries = await this.tournamentEntryManager.getAll(id);

        if (!entries)
            throw new NotFoundError('Tournament entries not found');

        return entries;
    }

    /**
     * @summary Adds a tournament
     * @isInt id
     */
    @Post()
    @Security('admin', ['tournament:write'])
    @SuccessResponse(200, 'Ok')
    public async add(@Body() model: NewTournamentModel): Promise<void> {
        const startTime = new Date(model.startTime);

        if (!startTime)
            throw new BadRequestError('Invalid Date');

        const launchTime = moment(model.startTime).subtract(6, 'minutes').toDate();
        await this.tournamentManager.addFromTemplate(model.templateId, launchTime, startTime);
        this.setStatus(200);
    }

    /**
     * @summary Updates a tournament
     * @isInt id
     */
    @Put('{id}')
    @Security('admin', ['tournament:write'])
    @SuccessResponse(200, 'Ok')
    public async update(@Path() id: number, @Body() update: TournamentUpdate): Promise<void> {
        await this.tournamentManager.update(id, update);
        this.setStatus(200);
    }

    /**
     * @summary Updates a tournaments prizes
     * @isInt id
     */
    @Put('{id}/prize')
    @Security('admin', ['tournament:write'])
    @SuccessResponse(200, 'Ok')
    public async updatePrizes(@Path() id: number, @Body() prizes: RankedPrize[]): Promise<void> {
        await this.tournamentManager.updatePrizes(id, prizes);
        this.setStatus(200);
    }

    /**
     * @summary Updates a tournaments entry costs
     */
    @Put('{id}/entry-cost')
    @Security('admin', ['tournament:write'])
    @SuccessResponse(200, 'Ok')
    public async updateEntryCosts(@Path() id: number, @Body() entryCosts: number[]): Promise<void> {
        await this.tournamentManager.updateEntryCosts(id, entryCosts);
        this.setStatus(200);
    }

    /**
     * @summary Updates a tournaments jackpot triggers
     * @isInt id
     */
    @Put('{id}/jackpot-trigger')
    @Security('admin', ['tournament:write'])
    @SuccessResponse(200, 'Ok')
    public async updateJackpotTriggers(@Path() id: number, @Body() triggers: JackpotTrigger[]): Promise<void> {
        await this.tournamentManager.updateJackpotTriggers(id, triggers);
        this.setStatus(200);
    }

    /**
     * @summary Completes a tournament
     * @isInt id
     */
    @Post('{id}/complete')
    @Security('admin', ['tournament:write'])
    @SuccessResponse(200, 'Ok')
    public async complete(id: number): Promise<void> {
        await this.runtimeManager.complete(id);
        this.setStatus(200);
    }

    /**
     * @summary Cancels a tournament
     * @isInt id
     */
    @Post('{id}/cancellation')
    @Security('admin', ['tournament:write'])
    @SuccessResponse(200, 'Ok')
    public async cancel(id: number): Promise<void> {
        await this.runtimeManager.cancel(id);
        this.setStatus(200);
    }

}
