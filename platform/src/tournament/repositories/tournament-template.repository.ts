import { GlobalDB } from '../../core/db';
import { Singleton, Inject } from '../../core/ioc';
import { TournamentTemplateEntity, TournamentTemplatePrizeEntity, TournamentTemplateGameAssignmentEntity, TournamentTemplateJackpotTriggerEntity, TournamentTemplateEntryCostEntity } from '../entities';
import { FindManyOptions, Not, IsNull } from 'typeorm';
import _ from 'lodash';
import { TournamentTemplateFilter } from '../tournament-template-filter';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class TournamentTemplateRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: TournamentTemplateFilter): Promise<TournamentTemplateEntity[]> {
        const connection = await this.db.getConnection();
        const options: FindManyOptions = {
            relations: ['skins', 'type', 'gameAssignments', 'prizes', 'jackpotTriggers', 'entryCosts']
        };

        if (filter) {
            const where: any = {};

            if (filter.enabled === true || filter.enabled === false)
                where.enabled = filter.enabled;

            if (filter.region)
                where.region = filter.region;

            if (filter.scheduleType)
                if (filter.scheduleType === 'cron')
                    where.cronPattern = Not(IsNull());
                else
                    where.cronPattern = IsNull();

            options.where = where;
        }

        return connection.manager.find(TournamentTemplateEntity, options);
    }

    public async get(id: number): Promise<TournamentTemplateEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(TournamentTemplateEntity, id, {
            relations: ['skins', 'type', 'gameAssignments', 'prizes', 'jackpotTriggers', 'entryCosts']
        });
    }

    public async add(entity: TournamentTemplateEntity): Promise<TournamentTemplateEntity> {
        const connection = await this.db.getConnection();
        delete (entity as any).id;

        if (entity.gameAssignments && entity.gameAssignments.length > 0) {
            const sortedAssignments = _.sortBy(entity.gameAssignments, g => g.position);
            for (let i = 0; i < sortedAssignments.length; i++) {
                delete (sortedAssignments[i] as any).templateId;
                sortedAssignments[i].position = i + 1;
            }

            entity.gameAssignments = sortedAssignments;
        }

        if (entity.prizes && entity.prizes.length > 0)
            for (const prize of entity.prizes as any[]) {
                delete prize.id;
                delete prize.templateId;
            }

        if (entity.jackpotTriggers && entity.jackpotTriggers.length > 0)
            for (const trigger of entity.jackpotTriggers as any[]) {
                delete trigger.id;
                delete trigger.templateId;
            }

        return connection.transaction(async manager => {
            const created = await manager.save(entity);

            if (entity.prizes && entity.prizes.length > 0) {
                for (const prize of entity.prizes)
                    prize.templateId = created.id;

                await manager.save(entity.prizes);
            }

            if (entity.jackpotTriggers && entity.jackpotTriggers.length > 0) {
                for (const trigger of entity.jackpotTriggers)
                    trigger.templateId = created.id;

                await manager.save(entity.jackpotTriggers);
            }

            if (entity.gameAssignments && entity.gameAssignments.length > 0) {
                for (const assignment of entity.gameAssignments)
                    assignment.templateId = created.id;

                await manager.save(entity.gameAssignments);
            }

            if (entity.entryCosts && entity.entryCosts.length > 0) {
                for (const entryCost of entity.entryCosts)
                    entryCost.templateId = created.id;

                await manager.save(entity.entryCosts);
            }

            return created;
        });
    }

    public async update(entity: TournamentTemplateEntity): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.save(entity);
    }

    public async updatePrizes(id: number, entities: TournamentTemplatePrizeEntity[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.transaction(async manager => {
            await manager.delete(TournamentTemplatePrizeEntity, {
                templateId: id
            });

            if (entities.length === 0)
                return;

            for (const entity of entities)
                entity.templateId = id;

            await manager.save(entities);
        });
    }

    public async updateEntryCosts(id: number, entities: TournamentTemplateEntryCostEntity[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.transaction(async manager => {
            await manager.delete(TournamentTemplateEntryCostEntity, {
                templateId: id
            });

            if (entities.length === 0)
                return;

            for (const entity of entities)
                entity.templateId = id;

            await manager.save(entities);
        });
    }

    public async updateJackpotTriggers(id: number, entities: TournamentTemplateJackpotTriggerEntity[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.transaction(async manager => {
            await manager.delete(TournamentTemplateJackpotTriggerEntity, {
                templateId: id
            });

            if (entities.length === 0)
                return;

            for (const entity of entities)
                entity.templateId = id;

            await manager.save(entities);
        });
    }

    public async updateGameAssignments(id: number, entities: TournamentTemplateGameAssignmentEntity[]): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.transaction(async manager => {
            await manager.delete(TournamentTemplateGameAssignmentEntity, {
                templateId: id
            });

            if (entities.length === 0)
                return;

            const sortedAssignments = _.sortBy(entities, g => g.position);
            for (let i = 0; i < sortedAssignments.length; i++) {
                sortedAssignments[i].templateId = id;
                sortedAssignments[i].position = i + 1;
            }

            await manager.save(sortedAssignments);
        });
    }

    public async remove(id: number): Promise<undefined> {
        const connection = await this.db.getConnection();
        await connection.manager.delete(TournamentTemplateEntity, id);
        return;
    }
}