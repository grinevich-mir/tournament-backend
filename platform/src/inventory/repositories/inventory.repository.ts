import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { InventoryItemEntity } from '../entities';
import { NotFoundError } from '../../core/errors';
import { FindConditions, FindManyOptions, In, IsNull, Not, Raw } from 'typeorm';
import { InventoryFilter, InventoryGetAllFilter } from '../inventory-filter';
import { LogClass } from '../../core/logging';
import { PagedResult } from '../../core';
import { InventoryItem } from '../inventory-item';
import { InventoryItemEntityMapper } from '../entities/mapper';
import { NewInventoryItem } from '../new-inventory-item';

@Singleton
@LogClass()
export class InventoryRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly entityMapper: InventoryItemEntityMapper) {
    }

    public async getAll(filter?: InventoryGetAllFilter): Promise<PagedResult<InventoryItem>> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<InventoryItemEntity> = {
            order: {
                createTime: 'ASC'
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

        const [entities, count] = await connection.manager.findAndCount(InventoryItemEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;

        const items = entities.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(items, count, page, pageSize);
    }

    public async get(id: number): Promise<InventoryItem | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(InventoryItemEntity, { id });

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async count(filter?: InventoryFilter): Promise<number> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<InventoryItemEntity> = {};

        if (filter)
            options.where = this.getFilterWhereClauses(filter);

        return connection.manager.count(InventoryItemEntity, options);
    }

    public async add(item: NewInventoryItem): Promise<InventoryItem> {
        const connection = await this.db.getConnection();
        const entity = this.entityMapper.newToEntity(item);
        const saved = await connection.manager.save(entity);
        return this.entityMapper.fromEntity(saved);
    }

    public async setClaimed(id: number, claimed: boolean): Promise<void> {
        const connection = await this.db.getConnection();
        const item = await connection.manager.findOne(InventoryItemEntity, { id });

        if (!item)
            throw new NotFoundError('Inventory item not found.');

        await connection.manager.update(InventoryItemEntity, id, {
            claimedTime: claimed ? new Date() : null as unknown as Date
        });
    }

    public async enable(...ids: number[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(InventoryItemEntity, {
            id: In(ids)
        }, {
            enabled: true
        });
    }

    public async disable(...ids: number[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(InventoryItemEntity, {
            id: In(ids)
        }, {
            enabled: false
        });
    }

    private getFilterWhereClauses(filter: InventoryFilter): FindConditions<InventoryItem> {
        const where: FindConditions<InventoryItem> = {};

        if (filter.userId)
            where.userId = filter.userId;

        if (filter.type)
            where.type = filter.type;

        if (filter.claimed !== undefined)
            if (filter.claimed === true)
                where.claimedTime = Not(IsNull());
            else if (filter.claimed === false)
                where.claimedTime = IsNull();

        if (filter.expired !== undefined)
            if (filter.expired === true)
                where.expires = Raw(alias => `claimedTime IS NOT NULL AND ${alias} <= CURRENT_TIMESTAMP`);
            else if (filter.expired === false)
                where.expires = Raw(alias => `(${alias} IS NULL OR ${alias} > CURRENT_TIMESTAMP)`);

        if (filter.enabled !== undefined)
            where.enabled = filter.enabled;

        return where;
    }
}
