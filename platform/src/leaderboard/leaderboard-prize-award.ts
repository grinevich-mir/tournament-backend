import { RankedPrize } from '../prize';

export interface LeaderboardPrizeAward {
    leaderboardId: number;
    userId: number;
    rank: number;
    prizes: RankedPrize[];
}