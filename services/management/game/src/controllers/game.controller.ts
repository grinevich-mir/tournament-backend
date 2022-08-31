import { AdminController, Get, Route, Security, Tags, Query, Path } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { GameManager } from '@tcom/platform/lib/game';
import _ from 'lodash';
import { PagedResult, NotFoundError } from '@tcom/platform/lib/core';
import { Game } from '@tcom/platform/lib/game';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Games')
@Route('game')
@Security('admin', ['game:read', 'game:filter'])
@LogClass()
export class GameController extends AdminController {
    constructor(
        @Inject private readonly gameManager: GameManager) {
        super();
    }

    /**
     * @summary Get games
     */
    @Get()
    public async getAll(@Query() page: number = 1, @Query() pageSize: number = 20): Promise<PagedResult<Game>> {
        return this.gameManager.getAll({
            page,
            pageSize
        });
    }

    /**
     * @summary Get a game by ID
     */
    @Get('{id}')
    public async get(@Path() id: number): Promise<Game> {
        const game = await this.gameManager.get(id);

        if (!game)
            throw new NotFoundError('Game not found.');

        return game;
    }
}
