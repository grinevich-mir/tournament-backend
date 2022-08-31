import { LeaderboardEntry } from './leaderboard-entry';
import { LeaderboardInfo } from './leaderboard-info';

export interface Leaderboard extends LeaderboardInfo {
    entries: LeaderboardEntry[];
    userEntry?: LeaderboardEntry;
}