import { PagedFilter } from '../core';
import { Game } from './game';

export interface GameFilter extends PagedFilter<Game> {
    enabled?: boolean;
}