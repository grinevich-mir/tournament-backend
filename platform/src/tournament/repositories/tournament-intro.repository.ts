import { FindManyOptions } from 'typeorm';
import { TournamentIntroFilter } from '..';
import { PagedResult } from '../../core';
import { GlobalDB } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { TournamentIntroEntity } from '../entities';
import { TournamentIntroEntityMapper } from '../entities/mappers';
import { TournamentIntro } from '../tournament-intro';
import { TournamentIntroUpdate } from '../tournament-intro-update';

@Singleton
@LogClass()
export class TournamentIntroRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly entityMapper: TournamentIntroEntityMapper) {
    }

    public async getAll(filter?: TournamentIntroFilter): Promise<PagedResult<TournamentIntro>> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<TournamentIntroEntity> = {
            order: {
                createTime: 'DESC'
            }
        };

        if (filter) {
            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.enabled !== undefined)
                options.where = {
                    enabled: filter.enabled
                };

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(TournamentIntroEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;

        const items = entities.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(items, count, page, pageSize);
    }

    public async get(id: number): Promise<TournamentIntro | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(TournamentIntroEntity, { id });

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async add(intro: TournamentIntroUpdate): Promise<TournamentIntro> {
        const connection = await this.db.getConnection();
        const entity = this.entityMapper.newToEntity(intro);
        const saved = await connection.manager.save(entity);
        return this.entityMapper.fromEntity(saved);
    }

    public async update(id: number, intro: TournamentIntroUpdate): Promise<TournamentIntro> {
        const connection = await this.db.getConnection();
        const entity = this.entityMapper.updateToEntity(id, intro);
        await connection.manager.save(entity);
        return await this.get(id) as TournamentIntro;
    }
}