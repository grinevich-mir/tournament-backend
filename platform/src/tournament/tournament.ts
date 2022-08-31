import { TournamentBase } from './tournament-base';
import { TournamentState } from './tournament-state';
import { GameMetadata } from '../game';

export interface Tournament extends TournamentBase {
    state: TournamentState;
    playerCount: number;
    templateId: number;
    gamePosition: number;
    gameId: number;
    gameMetadataOverride: GameMetadata;
    enabled: boolean;
    launchTime: Date;
    entryCutOffTime: Date;
    startTime: Date;
    endTime?: Date;
    completeTime?: Date;
}