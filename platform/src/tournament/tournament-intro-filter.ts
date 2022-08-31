import { PagedFilter } from '../core';
import { TournamentIntro } from './tournament-intro';

export interface TournamentIntroFilter {
    enabled?: boolean;
}

export interface TournamentIntroFilter extends PagedFilter<TournamentIntro> { }