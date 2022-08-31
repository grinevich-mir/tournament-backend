import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB, transactionRetry } from '../../core/db';
import { LeaderboardEntity, LeaderboardEntryEntity, LeaderboardPrizeEntity } from '../entities';
import { PagedResult } from '../../core';
import { convertOrdering } from '../../core/db/orm';
import { In, FindManyOptions } from 'typeorm';
import _ from 'lodash';
import { LogClass } from '../../core/logging';
import { LeaderboardFilter } from '../leaderboard-filter';

@Singleton
@LogClass()
export class LeaderboardRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: LeaderboardFilter): Promise<PagedResult<LeaderboardEntity>> {
        const connection = await this.db.getConnection();

        let page = 1;
        let pageSize = 100;

        let query = connection.createQueryBuilder(LeaderboardEntity, 'leaderboard')
            .leftJoinAndMapMany('leaderboard.prizes', LeaderboardPrizeEntity, 'prize', 'prize.leaderboardId = leaderboard.id')
            .loadRelationCountAndMap('leaderboard.entryCount', 'leaderboard.entries');

        if (filter) {
            const where: any = {};

            if (filter.order)
                query = query.orderBy(convertOrdering('leaderboard', filter.order));

            if (filter.finalised !== undefined)
                where.finalised = filter.finalised;

            if (filter.type)
                where.type = filter.type;

            if (filter.page && filter.pageSize) {
                page = filter.page;
                pageSize = filter.pageSize;
            }

            query = query.where(where);
        }

        query = query.skip((page - 1) * pageSize).take(pageSize);

        const [entities, count] = await query.getManyAndCount();
        return new PagedResult(entities, count, page, pageSize);
    }

    public async getInfo(id: number): Promise<LeaderboardEntity | undefined> {
        const connection = await this.db.getConnection();
        const query = connection.createQueryBuilder(LeaderboardEntity, 'leaderboard')
            .leftJoinAndMapMany('leaderboard.prizes', LeaderboardPrizeEntity, 'prize', 'prize.leaderboardId = leaderboard.id')
            .loadRelationCountAndMap('leaderboard.entryCount', 'leaderboard.entries')
            .where({
                id
            });

        return query.getOne();
    }

    public async get(id: number, skip?: number, take?: number): Promise<LeaderboardEntity | undefined> {
        const entity = await this.getInfo(id);

        if (!entity)
            return undefined;

        const options: FindManyOptions<LeaderboardEntryEntity> = {
            where: {
                leaderboardId: id
            },
            relations: ['user'],
            order: {
                rank: 'ASC'
            },
            skip,
            take
        };

        if (!entity.finalised)
            options.order = {
                points: 'DESC',
                tieBreaker: 'DESC',
                createTime: 'ASC'
            };

        const connection = await this.db.getConnection();
        entity.entries = await connection.manager.find(LeaderboardEntryEntity, options);

        return entity;
    }

    public async exists(id: number): Promise<boolean> {
        const connection = await this.db.getConnection();
        const count = await connection.manager.count(LeaderboardEntity, {
            where: {
                id
            }
        });
        return count > 0;
    }

    public async add(entity: LeaderboardEntity): Promise<LeaderboardEntity> {
        const connection = await this.db.getConnection();
        delete (entity as any).id;
        const created = await connection.manager.save(LeaderboardEntity, entity);

        for (const prize of entity.prizes)
            prize.leaderboardId = created.id;

        await connection.manager.save(entity.prizes, { reload: false });
        return created;
    }

    public async updatePrizes(id: number, entities: LeaderboardPrizeEntity[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.transaction(async manager => {
            await manager.delete(LeaderboardPrizeEntity, {
                leaderboardId: id
            });

            if (entities.length === 0)
                return;

            for (const entity of entities)
                entity.leaderboardId = id;

            await manager.save(entities);
        });
    }

    public async remove(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(LeaderboardEntity, id);
    }

    public async reset(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(LeaderboardEntryEntity, { leaderboardId: id });
    }

    public async updateRanks(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await transactionRetry(connection, async manager => {
            await manager.query(`SET @rank = 0`);
            await manager.query(`
                UPDATE leaderboard_entry U
                    SET rank = (@rank := (@rank + 1))
                WHERE
                    U.leaderboardId = ?
                ORDER BY
                    U.points DESC,
                    U.tieBreaker DESC,
                    CAST(userId as CHAR) DESC,
                    createTime ASC
            `, [id]);
        }).execute();
    }

    public async finalise(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(LeaderboardEntity, id, {
            finalised: true
        });
    }

    public async addEntries(id: number, userIds: number[]): Promise<void> {
        const connection = await this.db.getConnection();
        const entities = userIds.map(userId => {
            const entity = new LeaderboardEntryEntity();
            entity.userId = userId;
            entity.leaderboardId = id;
            return entity;
        });

        await connection.manager.insert(LeaderboardEntryEntity, entities);
    }

    public async getEntry(id: number, userId: number): Promise<LeaderboardEntryEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(LeaderboardEntryEntity, {
            relations: ['user'],
            where: {
                leaderboardId: id,
                userId
            }
        });
    }

    public async entryExists(id: number, userId: number): Promise<boolean> {
        const connection = await this.db.getConnection();
        const count = await connection.manager.count(LeaderboardEntryEntity, {
            where: {
                leaderboardId: id,
                userId
            }
        });
        return count > 0;
    }

    public async saveEntries(entries: LeaderboardEntryEntity[]): Promise<void> {
        const connection = await this.db.getConnection();
        await transactionRetry(connection, async manager => {
            const entryChunks = _.chunk(entries, 10000);
            for (const chunk of entryChunks)
                await manager.save(chunk, { reload: false });
        }).execute();
    }

    public async removeEntries(id: number, userIds: number[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.createQueryBuilder()
            .delete()
            .from(LeaderboardEntryEntity)
            .where({
                leaderboardId: id,
                userId: In(userIds)
            })
            .execute();
    }

    public async setPayoutTime(id: number, payoutTime: Date): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(LeaderboardEntity, id, {
            payoutTime
        });
    }
}