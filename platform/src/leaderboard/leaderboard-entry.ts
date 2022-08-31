export interface LeaderboardEntry {
    userId: number;
    displayName: string;
    country: string;
    avatarUrl?: string;
    rank: number;
    points: number;
    tieBreaker: number;
    runningPoints: number;
    runningTieBreaker: number;
    active?: boolean;
}