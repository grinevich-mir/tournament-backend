import { Singleton, Inject } from '../../core/ioc';
import _ from 'lodash';
import { GlobalDB } from '../../core/db';
import { Region, PagedResult } from '../../core';
import { TournamentEntity, TournamentTaskEntity, TournamentTypeEntity, TournamentEntryEntity, TournamentEntryPrizeEntity, TournamentPrizeEntity, TournamentJackpotTriggerEntity, TournamentEntryCostEntity } from '../entities';
import { Raw, FindOneOptions, In } from 'typeorm';
import { TournamentState } from '../tournament-state';
import moment from 'moment';
import { TournamentFilter } from '../tournament-filter';
import { LogClass } from '../../core/logging';
import { convertOrdering } from '../../core/db/orm';

@Singleton
@LogClass()
export class TournamentRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: TournamentFilter, cache?: boolean | number): Promise<PagedResult<TournamentEntity>> {

        const connection = await this.db.getConnection();

        const query = connection.createQueryBuilder(TournamentEntity, 'tournament')
            .leftJoinAndSelect('tournament.type', 'type')
            .leftJoinAndSelect('tournament.skins', 'skins')
            .leftJoinAndSelect('tournament.prizes', 'prize')
            .leftJoinAndSelect('tournament.jackpotTriggers', 'jackpotTrigger')
            .leftJoinAndSelect('tournament.entryCosts', 'entryCost');

        if (filter) {
            if (filter.templateId)
                query.andWhere('tournament.templateId = :templateId', { templateId: filter.templateId });

            if (filter.states && filter.states.length)
                query.andWhere('tournament.state IN(:states)', { states: filter.states });

            if (filter.region)
                query.andWhere('tournament.region = :region', { region: filter.region });

            if (filter.enabled)
                query.andWhere('tournament.enabled = :enabled', { enabled: filter.enabled });

            if (filter.completeTimeFrom && filter.completeTimeTo)
                query.andWhere('tournament.completeTime BETWEEN :completeTimeFrom AND :completeTimeTo', { completeTimeFrom: filter.completeTimeFrom, completeTimeTo: filter.completeTimeTo });

            if (filter.gameId)
                query.andWhere('tournament.gameId = :gameId', { gameId: filter.gameId });

            if (filter.playerCountFrom && filter.playerCountTo)
                query.andWhere('tournament.playerCount BETWEEN :playerCountFrom AND :playerCountTo', { playerCountFrom: filter.playerCountFrom, playerCountTo: filter.playerCountTo });

            if (filter.playerIds && filter.playerIds.length > 0)
                query.innerJoin('tournament.entries', 'entry', 'entry.tournamentId = tournament.id AND entry.userId IN(:playerIds)', { playerIds: filter.playerIds });

            if (filter.page && filter.pageSize) {
                query.skip((filter.page - 1) * filter.pageSize);
                query.take(filter.pageSize);
            }

            if (filter.order)
                query.orderBy(convertOrdering('tournament', filter.order));
        }

        if (!filter || !filter.order)
            query.addOrderBy('tournament.startTime', 'ASC');

        if (cache)
            query.cache(cache);

        const [entities, count] = await query.getManyAndCount();

        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;

        return new PagedResult(entities, count, page, pageSize);
    }

    public async getAllForUser(userId: number, filter?: TournamentFilter, cache?: boolean | number): Promise<PagedResult<TournamentEntity>> {
        const connection = await this.db.getConnection();

        const query = connection.createQueryBuilder(TournamentEntity, 'tournament')
            .innerJoinAndMapMany('tournament.entries', TournamentEntryEntity, 'entry', 'entry.tournamentId = tournament.id AND entry.userId = :userId', { userId })
            .leftJoinAndMapMany('entry.prizes', TournamentEntryPrizeEntity, 'prize', 'prize.entryId = entry.id')
            .where('tournament.enabled = true');

        if (filter) {
            if (filter.templateId)
                query.andWhere('tournament.templateId = :templateId', { templateId: filter.templateId });

            if (filter.states && filter.states.length)
                query.andWhere('tournament.state IN(:states)', { states: filter.states });

            if (filter.region)
                query.andWhere('tournament.region = :region', { region: filter.region });

            if (filter.gameId)
                query.andWhere('tournament.gameId = :gameId', { gameId: filter.gameId });

            if (filter.page && filter.pageSize) {
                query.skip((filter.page - 1) * filter.pageSize);
                query.take(filter.pageSize);
            }

            if (filter.order)
                query.orderBy(convertOrdering('tournament', filter.order));
        }


        if (cache)
            query.cache(cache);

        const [entities, count] = await query.getManyAndCount();

        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;

        return new PagedResult(entities, count, page, pageSize);
    }

    public async get(id: number, cache?: boolean | number): Promise<TournamentEntity | undefined> {
        const connection = await this.db.getConnection();
        const options: FindOneOptions<TournamentEntity> = {
            relations: ['type', 'skins', 'prizes', 'jackpotTriggers', 'entryCosts'],
            cache
        };

        return connection.manager.findOne(TournamentEntity, id, options);
    }

    public async getByTaskId(taskId: string): Promise<TournamentEntity | undefined> {
        const connection = await this.db.getConnection();
        const options: FindOneOptions<TournamentTaskEntity> = {
            relations: ['tournament', 'tournament.type', 'tournament.skins', 'tournament.prizes', 'tournament.jackpotTriggers', 'tournament.entryCosts'],
            where: {
                taskId
            }
        };

        const entity = await connection.manager.findOne(TournamentTaskEntity, options);

        if (!entity)
            return undefined;

        return entity.tournament;
    }

    public async getForLaunch(region?: Region): Promise<TournamentEntity[]> {
        const connection = await this.db.getConnection();
        const where: any = {
            state: TournamentState.Scheduled,
            launchTime: Raw((alias) => `${alias} <= CURRENT_TIMESTAMP`)
        };

        if (region)
            where.region = region;

        return connection.manager.find(TournamentEntity, {
            relations: ['type', 'skins', 'prizes', 'jackpotTriggers', 'entryCosts'],
            where,
            order: { startTime: 'ASC' }
        });
    }

    public async getUnlaunched(region?: Region): Promise<TournamentEntity[]> {
        const connection = await this.db.getConnection();
        const where: any = {
            state: In([TournamentState.Scheduled, TournamentState.Launching]),
            startTime: Raw((alias) => `${alias} <= CURRENT_TIMESTAMP`)
        };

        if (region)
            where.region = region;

        return connection.manager.find(TournamentEntity, {
            relations: ['type', 'skins', 'prizes', 'jackpotTriggers', 'entryCosts'],
            where,
            order: { startTime: 'ASC' }
        });
    }

    public async add(entity: TournamentEntity): Promise<TournamentEntity> {
        const connection = await this.db.getConnection();
        delete (entity as any).id;

        return connection.transaction(async manager => {
            const created = await manager.save(entity);

            if (entity.prizes && entity.prizes.length > 0) {
                for (const prize of entity.prizes)
                    prize.tournamentId = created.id;

                await manager.save(entity.prizes);
            }

            if (entity.jackpotTriggers && entity.jackpotTriggers.length > 0) {
                for (const trigger of entity.jackpotTriggers)
                    trigger.tournamentId = created.id;

                await manager.save(entity.jackpotTriggers);
            }

            if (entity.entryCosts && entity.entryCosts.length > 0) {
                for (const entryCost of entity.entryCosts)
                    entryCost.tournamentId = created.id;

                await manager.save(entity.entryCosts);
            }

            return created;
        });
    }

    public async update(entity: TournamentEntity): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.save(entity);
    }

    public async updatePrizes(id: number, entities: TournamentPrizeEntity[]): Promise<void> {
        const connection = await this.db.getConnection();

        await connection.transaction(async manager => {
            await manager.delete(TournamentPrizeEntity, {
                tournamentId: id
            });

            if (entities.length === 0)
                return;

            for (const entity of entities)
                entity.tournamentId = id;

            await manager.save(entities);
        });
    }

    public async updateEntryCosts(id: number, entities: TournamentEntryCostEntity[]): Promise<void> {
        const connection = await this.db.getConnection();

        await connection.transaction(async manager => {
            await manager.delete(TournamentEntryCostEntity, {
                tournamentId: id
            });

            if (entities.length === 0)
                return;

            for (const entity of entities)
                entity.tournamentId = id;

            await manager.save(entities);
        });
    }

    public async updateJackpotTriggers(id: number, entities: TournamentJackpotTriggerEntity[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.transaction(async manager => {
            await manager.delete(TournamentJackpotTriggerEntity, {
                tournamentId: id
            });

            if (entities.length === 0)
                return;

            for (const entity of entities)
                entity.tournamentId = id;

            await manager.save(entities);
        });
    }

    public async setState(id: number, state: TournamentState): Promise<void> {
        const connection = await this.db.getConnection();
        const update: Partial<TournamentEntity> = { state };

        if (state >= TournamentState.Ended)
            update.completeTime = moment().utc().toDate();

        await connection.manager.update(TournamentEntity, id, update);
    }

    public async addTaskId(id: number, taskId: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.insert(TournamentTaskEntity, { tournamentId: id, taskId });
    }

    public async getTaskId(id: number): Promise<string | undefined> {
        const connection = await this.db.getConnection();
        const task = await connection.manager.findOne(TournamentTaskEntity, id);

        if (!task)
            return undefined;

        return task.taskId;
    }

    public async removeTaskId(id: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(TournamentTaskEntity, id);
    }

    public async getTaskDefinition(typeId: number): Promise<string | undefined> {
        const connection = await this.db.getConnection();
        const type = await connection.manager.findOne(TournamentTypeEntity, typeId);

        if (!type)
            return undefined;

        return type.taskDefinition;
    }

    public async updatePlayerCount(id: number): Promise<number> {
        const connection = await this.db.getConnection();
        let count = 0;

        await connection.transaction(async manager => {
            await manager.query('UPDATE tournament SET playerCount = LAST_INSERT_ID((SELECT COUNT(1) FROM tournament_entry WHERE tournamentId = ?)), updateTime = CURRENT_TIMESTAMP WHERE id = ?', [id, id]);
            const result = await manager.query('SELECT LAST_INSERT_ID() as playerCount');
            count = Number(result[0].playerCount);
        });

        return count;
    }

    public async getByLeaderboardId(leaderboardId: number): Promise<TournamentEntity | undefined> {
        const connection = await this.db.getConnection();
        const options: FindOneOptions<TournamentEntity> = {
            relations: ['leaderboard', 'prizes'],
            where: {
                leaderboardId
            }
        };

        const entity = await connection.manager.findOne(TournamentEntity, options);

        if (!entity)
            return undefined;

        return entity;
    }
}
