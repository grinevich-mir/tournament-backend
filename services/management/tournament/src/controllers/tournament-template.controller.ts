import { AdminController, Security } from '@tcom/platform/lib/api';
import { Body, Get, Query, Post, Delete, Route, SuccessResponse, Tags, Put, Path } from '@tcom/platform/lib/api/decorators';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { NotFoundError } from '@tcom/platform/lib/core';
import _ from 'lodash';
import { NewTournamentTemplate, TournamentTemplateManager, TournamentTemplate, TournamentTemplateFilter, TournamentTemplateUpdate, TournamentTemplateGameAssignment } from '@tcom/platform/lib/tournament';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { RankedPrize } from '@tcom/platform/lib/prize';
import { JackpotTrigger } from '@tcom/platform/lib/jackpot';

@Tags('Templates')
@Route('tournament/template')
@LogClass()
export class TournamentTemplateController extends AdminController {
    constructor(
        @Inject private readonly templateManager: TournamentTemplateManager) {
        super();
    }

    /**
     * @summary Gets a tournament template by ID
     * @isInt id
     */
    @Get('{id}')
    @Security('admin', ['tournament:template:read'])
    public async get(id: number): Promise<TournamentTemplate> {
        const tournamentTemplate = await this.templateManager.get(id);

        if (!tournamentTemplate)
            throw new NotFoundError('Tournament Template not found');

        return tournamentTemplate;
    }

    /**
     * @summary Get tournament templates
     */
    @Get()
    @Security('admin', ['tournament:template:read'])
    public async getAll(@Query() region?: string, @Query() scheduleType?: 'manual' | 'cron'): Promise<TournamentTemplate[]> {
        const filter: TournamentTemplateFilter = {
            region,
            scheduleType,
        };

        return this.templateManager.getAll(filter);
    }

    /**
     * @summary Creates a new Template
     */
    @Post()
    @Security('admin', ['tournament:template:write'])
    @SuccessResponse(200, 'Ok')
    public async add(@Body() template: NewTournamentTemplate): Promise<TournamentTemplate> {
        const created = await this.templateManager.add(template);
        this.setStatus(200);
        return created;
    }

    /**
     * @summary Duplicates a template
     */
    @Post('{id}')
    @Security('admin', ['tournament:template:duplicate'])
    @SuccessResponse(200, 'Ok')
    public async duplicate(@Path() id: number): Promise<TournamentTemplate> {
        const created = await this.templateManager.duplicate(id);
        this.setStatus(200);
        return created;
    }

    /**
     * @summary Updates a template
     */
    @Put('{id}')
    @Security('admin', ['tournament:template:write'])
    @SuccessResponse(200, 'Ok')
    public async update(@Path() id: number, @Body() update: TournamentTemplateUpdate): Promise<void> {
        await this.templateManager.update(id, update);
        this.setStatus(200);
    }

    /**
     * @summary Updates a template prizes
     */
    @Put('{id}/prize')
    @Security('admin', ['tournament:template:write'])
    @SuccessResponse(200, 'Ok')
    public async updatePrizes(@Path() id: number, @Body() prizes: RankedPrize[]): Promise<void> {
        await this.templateManager.updatePrizes(id, prizes);
        this.setStatus(200);
    }

    /**
     * @summary Updates a template entry costs
     */
    @Put('{id}/entry-cost')
    @Security('admin', ['tournament:template:write'])
    @SuccessResponse(200, 'Ok')
    public async updateEntryCosts(@Path() id: number, @Body() entryCosts: number[]): Promise<void> {
        await this.templateManager.updateEntryCosts(id, entryCosts);
        this.setStatus(200);
    }


    /**
     * @summary Updates a template jackpot triggers
     */
    @Put('{id}/jackpot-trigger')
    @Security('admin', ['tournament:template:write'])
    @SuccessResponse(200, 'Ok')
    public async updateJackpotTriggers(@Path() id: number, @Body() triggers: JackpotTrigger[]): Promise<void> {
        await this.templateManager.updateJackpotTriggers(id, triggers);
        this.setStatus(200);
    }

    /**
     * @summary Updates a template game assignments
     */
    @Put('{id}/game')
    @Security('admin', ['tournament:template:write'])
    @SuccessResponse(200, 'Ok')
    public async updateGameAssignments(@Path() id: number, @Body() assignments: TournamentTemplateGameAssignment[]): Promise<void> {
        await this.templateManager.updateGameAssignments(id, assignments);
        this.setStatus(200);
    }

    /**
     * @summary Deletes a Template
     */
    @Delete('{id}')
    @Security('admin', ['tournament:template:delete'])
    @SuccessResponse(200, 'Ok')
    public async remove(id: number): Promise<void> {
        await this.templateManager.remove(id);
        this.setStatus(200);
    }
}
