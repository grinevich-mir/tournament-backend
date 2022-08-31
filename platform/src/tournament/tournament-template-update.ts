import { TournamentUpdateBase } from './tournament-update-base';
import { TournamentGameSelectionType } from './tournament-game-selection-type';
import { TournamentRuntimeType } from './tournament-runtime-type';

export interface TournamentTemplateUpdate extends TournamentUpdateBase {
    cronPattern?: string;
    durationMins?: number;
    entryCutOff?: number;
    chatEnabled?: boolean;
    chatChannel?: string;
    gameSelectionType?: TournamentGameSelectionType;
    tags?: string[];
    runtime?: TournamentRuntimeType;
}
