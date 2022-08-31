import { Singleton, Inject } from '../core/ioc';
import { TournamentTemplateRepository } from './repositories';
import { TournamentTemplate } from './tournament-template';
import { TournamentTemplateFilter } from './tournament-template-filter';
import { TournamentTemplateEntityMapper } from './entities/mappers';
import { NewTournamentTemplate } from './new-tournament-template';
import { LogClass } from '../core/logging';
import { TournamentTemplateUpdate } from './tournament-template-update';
import { RankedPrize } from '../prize';
import { TournamentTemplateGameAssignment } from './tournament-template-game-assignment';
import { NotFoundError } from '../core';
import { JackpotTrigger } from '../jackpot';
import _ from 'lodash';

@Singleton
@LogClass()
export class TournamentTemplateManager {
    constructor(
        @Inject private readonly repository: TournamentTemplateRepository,
        @Inject private readonly entityMapper: TournamentTemplateEntityMapper) {
        }

    public async getAll(filter?: TournamentTemplateFilter): Promise<TournamentTemplate[]> {
        const entities = await this.repository.getAll(filter);
        return entities.map(e => this.entityMapper.fromEntity(e));
    }

    public async get(id: number): Promise<TournamentTemplate | undefined> {
        const entity = await this.repository.get(id);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async add(template: NewTournamentTemplate): Promise<TournamentTemplate> {
         const entity = this.entityMapper.newTemplateToEntity(template);
         const created = await this.repository.add(entity);
         return this.entityMapper.fromEntity(created);
    }

    public async duplicate(id: number): Promise<TournamentTemplate> {
        const entity = await this.repository.get(id);

        if (!entity)
            throw new NotFoundError('Template not found.');

        const newTemplate = this.entityMapper.entityToNewTemplate(entity);
        newTemplate.enabled = false;

        return this.add(newTemplate);
    }

    public async update(id: number, update: TournamentTemplateUpdate): Promise<void> {
        const entity = this.entityMapper.updateToEntity(id, update);
        await this.repository.update(entity);
    }

    public async updatePrizes(id: number, prizes: RankedPrize[]): Promise<void> {
        prizes = _.orderBy(prizes, e => e.startRank, 'asc');
        const entities = prizes.map(p => this.entityMapper.prizeToEntity(p));
        await this.repository.updatePrizes(id, entities);
    }

    public async updateEntryCosts(id: number, entryCosts: number[]): Promise<void> {
        const entities = entryCosts.map(p => this.entityMapper.entryCostToEntity(p));
        await this.repository.updateEntryCosts(id, entities);
    }

    public async updateJackpotTriggers(id: number, triggers: JackpotTrigger[]): Promise<void> {
        triggers = _.orderBy(triggers, e => e.threshold, 'desc');
        const entities = triggers.map(c => this.entityMapper.jackpotTriggerToEntity(c));
        await this.repository.updateJackpotTriggers(id, entities);
    }

    public async updateGameAssignments(id: number, assignments: TournamentTemplateGameAssignment[]): Promise<void> {
        const entities = assignments.map(a => this.entityMapper.gameAssignmentToEntity(a));
        await this.repository.updateGameAssignments(id, entities);
    }

    public async remove(id: number): Promise<void> {
        await this.repository.remove(id);
    }
}