import { AdminController, Route, Tags, Query, Security, Path, Get, Post, Body, Put } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { PagedResult } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { TournamentIntro, TournamentIntroManager, TournamentIntroPreview, TournamentIntroUpdate } from '@tcom/platform/lib/tournament';
import { TournamentIntroCompiler } from '@tcom/platform/lib/tournament/utilities';
import { TournamentIntroModel } from '@tcom/platform/lib/tournament/models';

@Tags('Intros')
@Route('tournament/intro')
@LogClass()
export class IntroController extends AdminController {
    constructor(
        @Inject private readonly manager: TournamentIntroManager,
        @Inject private readonly compiler: TournamentIntroCompiler) {
        super();
    }

    /**
     * @summary Gets all tournament intros
     * @isInt page
     * @isInt pageSize
     */
    @Get()
    @Security('admin', ['tournament:intro:read'])
    public async getAll(
        @Query() enabled?: boolean,
        @Query() page: number = 1,
        @Query() pageSize: number = 20
    ): Promise<PagedResult<TournamentIntro>> {
        return this.manager.getAll({
            enabled,
            page,
            pageSize
        });
    }

    /**
     * @summary Get tournament intro by ID
     */
    @Get('{id}')
    @Security('admin', ['tournament:intro:read'])
    public async getById(@Path() id: number): Promise<TournamentIntro> {
        return this.manager.get(id);
    }

    /**
     * @summary Adds a new tournament intro
     */
    @Post()
    @Security('admin', ['tournament:intro:write'])
    public async add(@Body() intro: TournamentIntroUpdate): Promise<TournamentIntro> {
        return this.manager.add(intro);
    }

    /**
     * @summary Updates a tournament intro
     */
    @Put('{id}')
    @Security('admin', ['tournament:intro:write'])
    public async update(id: number, @Body() intro: TournamentIntroUpdate): Promise<TournamentIntro> {
        return this.manager.update(id, intro);
    }

    /**
     * @summary Compiles a tournament intro preview
     */
    @Post('preview')
    @Security('admin', ['tournament:intro:write'])
    public async preview(@Body() preview: TournamentIntroPreview): Promise<TournamentIntroModel> {
        const intro: Partial<TournamentIntro> = {
            topContent: preview.topContent,
            bottomContent: preview.bottomContent
        };

        return this.compiler.compile(intro as TournamentIntro, preview.context);
    }
}