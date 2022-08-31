import { TournamentState } from '../tournament/tournament-state';
import { Region } from '../core/regions';
import { Tournament } from '../tournament';
import { PagedFilter } from '../core';

export interface TournamentStatisticsFilter<T = Tournament> extends PagedFilter<T> {
    templateId?: number;
    states?: TournamentState[];
    region?: Region;
    enabled?: boolean;
    timeFrom?: Date;
    timeTo?: Date;
    gameId?: number;
    providerId?: number;
    userId?: number;
    displayName?: string;
}