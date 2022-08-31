import { TournamentState } from './tournament-state';
import { Region } from '../core/regions';
import { Tournament } from './tournament';
import { PagedFilter } from '../core';

export interface TournamentFilter<T = Tournament> extends PagedFilter<T> {
    templateId?: number;
    states?: TournamentState[];
    region?: Region;
    enabled?: boolean;
    completeTimeFrom?: Date;
    completeTimeTo?: Date;
    gameId?: number;
    playerCountFrom?: number;
    playerCountTo?: number;
    playerIds?: number[];
}