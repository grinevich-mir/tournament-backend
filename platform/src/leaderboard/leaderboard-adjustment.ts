export interface LeaderboardAdjustment {
    userId: number;
    points: number;
    reset?: 'All' | 'Running';
    tieBreaker?: number | Date;
}