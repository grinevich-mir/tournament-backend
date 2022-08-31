import { Singleton, Inject } from '../core/ioc';
import { GameFilter } from './game-filter';
import { PagedResult } from '../core';
import { Game } from './game';
import { GameRepository } from './repositories';
import { GameEntityMapper } from './entities/mappers';
import { GameCache } from './cache';
import { LogClass } from '../core/logging';

@Singleton
@LogClass()
export class GameManager {
    constructor(
        @Inject private readonly cache: GameCache,
        @Inject private readonly repository: GameRepository,
        @Inject private readonly mapper: GameEntityMapper) {
        }

    public async getAll(filter?: GameFilter): Promise<PagedResult<Game>> {
        const result = await this.repository.getAll(filter);
        const items = result.items.map(e => this.mapper.fromEntity(e));
        return new PagedResult(items, result.totalCount, result.page, result.pageSize);
    }

    public async get(id: number): Promise<Game | undefined> {
        const cached = await this.cache.get(id);

        if (cached)
            return cached;

        const entity = await this.repository.get(id);

        if (!entity)
            return undefined;

        const game = this.mapper.fromEntity(entity);
        await this.cache.store(game);
        return game;
    }
}