import { GlobalDB } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { ReferralGroupEntity } from '../entities';
import { ReferralGroupEntityMapper } from '../entities/mappers';
import { ReferralGroup, ReferralGroupUpdate } from '../referral-group';
import { NotFoundError } from '../../core';

@Singleton
@LogClass()
export class ReferralGroupRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: ReferralGroupEntityMapper) {
    }

    public async getAll(): Promise<ReferralGroup[]> {
        const connection = await this.db.getConnection();
        const entities = await connection.manager.find(ReferralGroupEntity, {
            order: {
                id: 'ASC'
            }
        });

        if (!entities)
            return [];

        return entities.map(e => this.mapper.fromEntity(e));
    }

    public async get(id: number): Promise<ReferralGroup | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralGroupEntity, id);

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async add(name: string): Promise<ReferralGroup> {
        const connection = await this.db.getConnection();
        const count = await connection.manager.count(ReferralGroupEntity);
        const entity = new ReferralGroupEntity();
        entity.name = name;
        entity.default = count === 0;
        const created = await connection.manager.save(entity);
        return this.mapper.fromEntity(created);
    }

    public async update(id: number, group: ReferralGroupUpdate): Promise<ReferralGroup> {
        const existing = await this.get(id);

        if (!existing)
            throw new NotFoundError('Referral user group not found.');

        const connection = await this.db.getConnection();
        await connection.manager.update(ReferralGroupEntity, id, group);
        return await this.get(id) as ReferralGroup;
    }

    public async remove(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(ReferralGroupEntity, id);
    }

    public async getDefault(): Promise<ReferralGroup | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(ReferralGroupEntity, {
            where: {
                default: true
            }
        });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async setDefault(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.transaction(async manager => {
            await manager.createQueryBuilder(ReferralGroupEntity, 'group')
                .update()
                .set({ default: false })
                .where({ default: true })
                .execute();

            await manager.update(ReferralGroupEntity, id, {
                default: true
            });
        });
    }
}