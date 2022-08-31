import { TournamentBase } from './tournament-base';
import { TournamentTemplateGameAssignment } from './tournament-template-game-assignment';
import { TournamentGameSelectionType } from './tournament-game-selection-type';

export interface TournamentTemplate extends TournamentBase {
    enabled: boolean;
    tags?: string[];
    gameAssignments: TournamentTemplateGameAssignment[];
    cronPattern?: string;
    gameSelectionType: TournamentGameSelectionType;
    entryCutOff: number;
}