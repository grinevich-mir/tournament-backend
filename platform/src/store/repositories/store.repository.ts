import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { FindConditions, FindManyOptions, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { StoreFilter, StoreGetAllFilter } from '../store-filter';
import { LogClass } from '../../core/logging';
import { PagedResult } from '../../core';
import { StoreItemEntityMapper } from '../entities/mapper';
import { StoreItemEntity } from '../entities';
import { NewStoreItem } from '../new-store-item';
import { StoreItem } from '../store-item';
import { StoreItemUpdate } from '../store-item-update';

@Singleton
@LogClass()
export class StoreItemRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly entityMapper: StoreItemEntityMapper,
    ) {
    }

    public async getAll(filter?: StoreGetAllFilter): Promise<PagedResult<StoreItem>> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<StoreItemEntity> = {
            order: {
                priority: 'DESC',
                createTime: 'DESC'
            }
        };

        if (filter) {
            options.where = this.getFilterWhereClauses(filter);

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(StoreItemEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;

        const items = entities.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(items, count, page, pageSize);
    }

    public async get(id: number): Promise<StoreItem | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(StoreItemEntity, { id });

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async add(item: NewStoreItem): Promise<StoreItem> {
        const connection = await this.db.getConnection();
        const entity = this.entityMapper.newToEntity(item);
        const saved = await connection.manager.save(entity);
        return this.entityMapper.fromEntity(saved);
    }

    public async update(id: number, update: StoreItemUpdate): Promise<StoreItem> {
        const connection = await this.db.getConnection();
        const entity = this.entityMapper.updateToEntity(id, update);
        await connection.manager.save(entity);
        return await this.get(id) as StoreItem;
    }

    public async enable(...ids: number[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(StoreItemEntity, {
            id: In(ids)
        }, {
            enabled: true
        });
    }

    public async disable(...ids: number[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(StoreItemEntity, {
            id: In(ids)
        }, {
            enabled: false
        });
    }

    private getFilterWhereClauses(filter: StoreFilter): FindConditions<StoreItem> {
        const where: FindConditions<StoreItem> = {};

        if (filter.type)
            where.type = filter.type;

        if (filter.level !== undefined)
            where.minLevel = MoreThanOrEqual(filter.level);

        if (filter.level !== undefined)
            where.maxLevel = LessThanOrEqual(filter.level);

        if (filter.enabled !== undefined)
            where.enabled = filter.enabled;

        if (filter.public !== undefined)
            where.public = filter.public;

        return where;
    }
}
