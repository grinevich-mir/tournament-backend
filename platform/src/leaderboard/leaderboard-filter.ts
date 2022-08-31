import { LeaderboardType } from './leaderboard-type';
import { PagedFilter } from '../core';
import { LeaderboardInfo } from './leaderboard-info';

export interface LeaderboardFilter extends PagedFilter<LeaderboardInfo> {
    finalised?: boolean;
    type?: LeaderboardType;
}