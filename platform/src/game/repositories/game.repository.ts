import _ from 'lodash';
import { GlobalDB } from '../../core/db';
import { GameEntity } from '../entities';
import { Singleton, Inject } from '../../core/ioc';
import { PagedResult } from '../../core';
import { FindManyOptions } from 'typeorm';
import { GameProvider } from '../game-provider';
import { GameFilter } from '../game-filter';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class GameRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: GameFilter): Promise<PagedResult<GameEntity>> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions<GameEntity> = {
            relations: ['type', 'provider'],
            order: {
                name: 'ASC'
            }
        };

        if (filter) {
            options.where = {};

            if (filter.enabled !== undefined)
                options.where.enabled = filter.enabled;

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(GameEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async get(id: number): Promise<GameEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(GameEntity, id, {
            relations: ['type', 'provider']
        });
    }

    public async getByProviderRef(provider: GameProvider, ref: string): Promise<GameEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(GameEntity, {
            relations: ['type', 'provider'],
            where: {
                providerId: provider,
                providerRef: ref
            }
        });
    }
}