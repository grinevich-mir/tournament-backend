import { PagedFilter } from '../core';
import { LeaderboardScheduleItem } from './leaderboard-schedule-item';

export interface LeaderboardScheduleItemFilter extends PagedFilter<LeaderboardScheduleItem> {
    enabled?: boolean;
    finalised?: boolean;
}