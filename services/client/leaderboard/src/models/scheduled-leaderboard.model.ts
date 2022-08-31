import { LeaderboardScheduleItem } from '@tcom/platform/lib/leaderboard';
import { LeaderboardModel } from '@tcom/platform/lib/leaderboard/models';

export interface ScheduledLeaderboardModel extends LeaderboardScheduleItem {
    leaderboard: LeaderboardModel;
}