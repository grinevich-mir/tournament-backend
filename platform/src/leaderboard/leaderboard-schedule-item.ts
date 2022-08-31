import { LeaderboardScheduleFrequency } from './leaderboard-schedule-frequency';

export interface NewLeaderboardScheduleItem {
    scheduleName: string;
    frequency: LeaderboardScheduleFrequency;
    leaderboardId: number;
    minLevel: number;
    startTime: Date;
    endTime: Date;
    autoPayout: boolean;
    enabled: boolean;
}

export interface LeaderboardScheduleItem extends NewLeaderboardScheduleItem {
    id: number;
    finalised: boolean;
    createTime: Date;
    updateTime: Date;
}