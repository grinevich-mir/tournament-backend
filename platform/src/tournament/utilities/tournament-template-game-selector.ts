import { Singleton, Inject } from '../../core/ioc';
import { TournamentGameSelectionType } from '../tournament-game-selection-type';
import _ from 'lodash';
import { TournamentTemplate } from '../tournament-template';
import { TournamentTemplateGameAssignment } from '../tournament-template-game-assignment';
import { TournamentRepository } from '../repositories';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class TournamentTemplateGameSelector {
    constructor(
        @Inject private readonly tournamentRepository: TournamentRepository) {
        }

    public async select(template: TournamentTemplate): Promise<TournamentTemplateGameAssignment> {
        if (!template.gameAssignments || template.gameAssignments.length === 0)
            throw new Error(`Template ${template.id} has no games assigned to it!`);

        if (template.gameAssignments.length === 1)
            return template.gameAssignments[0];

        const lastPosition = await this.getLastGamePosition(template);

        switch (template.gameSelectionType) {
            case TournamentGameSelectionType.Sequential:
                return this.selectGameSequentially(template, lastPosition);

            case TournamentGameSelectionType.Random:
                return this.selectGameRandomly(template, lastPosition);
        }
    }

    private async getLastGamePosition(template: TournamentTemplate): Promise<number> {
        const lastTournamentResult = await this.tournamentRepository.getAll({
            templateId: template.id,
            enabled: true,
            page: 1,
            pageSize: 1,
            order: {
                id: 'DESC'
            }
        });

        if (lastTournamentResult.totalCount === 0)
            return 1;

        return lastTournamentResult.items[0].gamePosition;
    }

    private selectGameSequentially(template: TournamentTemplate, lastPosition: number): TournamentTemplateGameAssignment {
        const assigments = _.sortBy(template.gameAssignments, ['position']);
        const lastGameIndex = assigments.findIndex(g => g.position === lastPosition);
        let nextIndex = lastGameIndex >= 0 ? lastGameIndex + 1 : 0;

        if (nextIndex >= assigments.length)
            nextIndex = 0;

        return assigments[nextIndex];
    }

    private selectGameRandomly(template: TournamentTemplate, lastPosition: number): TournamentTemplateGameAssignment {
        const games = template.gameAssignments.filter(g => g.position !== lastPosition);
        return _.sample(games) as TournamentTemplateGameAssignment;
    }
}