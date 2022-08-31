export interface LeaderboardAdjustmentResult {
    userId: number;
    rank: number;
    points: number;
    tieBreaker: number;
    runningPoints: number;
    runningTieBreaker: number;
    prevPoints: number;
    prevRunningPoints: number;
}