import { LeaderboardType } from './leaderboard-type';
import { LeaderboardPointConfig } from './leaderboard-point-config';
import { RankedPrize } from '../prize';

export interface NewLeaderboard {
    type: LeaderboardType;
    pointConfig?: LeaderboardPointConfig;
    prizes?: RankedPrize[];
}
