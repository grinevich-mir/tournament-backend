import { Singleton, Inject } from '../../core/ioc';
import { UpgradeCodeEntity } from '../entities/upgrade-code.entity';
import { GlobalDB } from '../../core/db';
import { FindOneOptions, Raw, IsNull, FindManyOptions, Not } from 'typeorm';
import { LogClass } from '../../core/logging';
import { UpgradeCodeEntityMapper } from '../entities/mappers';
import { UpgradeCode } from '../upgrade-code';
import { NewUpgradeCode } from '../new-upgrade-code';
import { PagedResult } from '../../core';
import { UpgradeCodeFilter } from '../upgrade-code-filter';

@Singleton
@LogClass()
export class UpgradeCodeRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly entityMapper: UpgradeCodeEntityMapper) {
    }

    public async getAll(filter?: UpgradeCodeFilter): Promise<PagedResult<UpgradeCode>> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<UpgradeCodeEntity> = {
            relations: ['inventoryItems'],
            order: {
                createTime: 'ASC'
            }
        };

        if (filter) {
            options.where = {};

            if (filter.userId)
                options.where.userId = filter.userId;

            if (filter.processed)
                options.where.processTime = Not(IsNull());

            if (filter.expired === true)
                options.where.processExpireTime = Raw(alias => `${alias} <= CURRENT_TIMESTAMP`);
            else if (filter.expired === false)
                options.where.processExpireTime = Raw(alias => `${alias} > CURRENT_TIMESTAMP`);

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;
        }

        const [entities, count] = await connection.manager.findAndCount(UpgradeCodeEntity, options);
        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;

        const items = entities.map(e => this.entityMapper.fromEntity(e));
        return new PagedResult(items, count, page, pageSize);
    }

    public async get(code: string): Promise<UpgradeCode | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(UpgradeCodeEntity, code, {
            relations: ['inventoryItems']
        });

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async getByUserId(userId: number): Promise<UpgradeCode | undefined> {
        const connection = await this.db.getConnection();

        const options: FindOneOptions<UpgradeCodeEntity> = {
            relations: ['inventoryItems'],
            where: {
                userId,
                processTime: IsNull(),
                expireTime: Raw((alias) => `${alias} > CURRENT_TIMESTAMP`)
            },
            order: {
                createTime: 'DESC'
            }
        };

        const entity = await connection.manager.findOne(UpgradeCodeEntity, options);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async add(code: NewUpgradeCode): Promise<UpgradeCode> {
        const connection = await this.db.getConnection();
        const entity = this.entityMapper.newToEntity(code);
        await connection.manager.insert(UpgradeCodeEntity, entity);
        return this.entityMapper.fromEntity(entity);
    }

    public async exists(code: string): Promise<boolean> {
        const connection = await this.db.getConnection();
        return await connection.manager.count(UpgradeCodeEntity, { where: { code } }) > 0;
    }

    public async setProcessed(code: string, inventoryItemIds: number[], processTime: Date, processedBy: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.transaction(async manager => {
            await manager.update(UpgradeCodeEntity, code, {
                processTime,
                processedBy
            });

            if (inventoryItemIds.length > 0)
                await manager.createQueryBuilder()
                    .relation(UpgradeCodeEntity, 'inventoryItems')
                    .of(code)
                    .add(inventoryItemIds);
        });
    }

    public async deleteUnused(): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(UpgradeCodeEntity, {
            processTime: IsNull(),
            processExpireTime: Raw((alias) => `${alias} > CURRENT_TIMESTAMP`)
        });
    }
}