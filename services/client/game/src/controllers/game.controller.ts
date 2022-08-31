import { Get, Route, Tags, ClientController, Query } from '@tcom/platform/lib/api';
import { GameModelMapper, GameModel } from '@tcom/platform/lib/game/models';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { GameManager } from '@tcom/platform/lib/game';
import { PagedResult } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Route('game')
@LogClass()
export class GameController extends ClientController {
    constructor(
        @Inject private readonly manager: GameManager,
        @Inject private readonly mapper: GameModelMapper) {
            super();
        }

    /**
     * @summary Gets all games
     */
    @Tags('Games')
    @Get()
    public async getAll(@Query() page: number = 1, @Query() pageSize: number = 20): Promise<PagedResult<GameModel>> {
        const games = await this.manager.getAll({
            page,
            pageSize
        });

        const models = games.items.map(g => this.mapper.map(g));
        return new PagedResult(models, games.totalCount, games.page, games.pageSize);
    }
}
