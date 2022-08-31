import { LeaderboardPointConfig } from './leaderboard-point-config';
import { LeaderboardScheduleFrequency } from './leaderboard-schedule-frequency';
import { RankedPrize } from '../prize';

export interface NewLeaderboardSchedule {
    name: string;
    frequency: LeaderboardScheduleFrequency;
    offset: number;
    pointConfig?: LeaderboardPointConfig;
    minLevel: number;
    prizes: RankedPrize[];
    autoPayout: boolean;
    enabled: boolean;
}

export interface LeaderboardScheduleUpdate extends NewLeaderboardSchedule {
}

export interface LeaderboardSchedule extends NewLeaderboardSchedule {
    createTime: Date;
    updateTime: Date;
}