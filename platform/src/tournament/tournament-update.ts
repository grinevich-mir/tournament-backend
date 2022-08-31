import { GameMetadata } from '../game';
import { TournamentUpdateBase } from './tournament-update-base';

export interface TournamentUpdate extends TournamentUpdateBase {
    gameId?: number;
    gameMetadataOverride?: GameMetadata;
    gamePosition?: number;
    startTime?: Date;
    endTime?: Date;
    entryCutOffTime?: Date;
}