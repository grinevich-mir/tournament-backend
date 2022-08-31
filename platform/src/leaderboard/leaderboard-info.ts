import { LeaderboardType } from './leaderboard-type';
import { LeaderboardPointConfig } from './leaderboard-point-config';
import { RankedPrize } from '../prize';

export interface LeaderboardInfo {
    id: number;
    type: LeaderboardType;
    prizes: RankedPrize[];
    pointConfig?: LeaderboardPointConfig;
    entryCount: number;
    finalised: boolean;
    createTime: Date;
    payoutTime?: Date;
}