import { GameMetadata } from '../game';

export interface TournamentTemplateGameAssignment {
    gameId: number;
    position: number;
    metadataOverride?: GameMetadata;
}