export interface LeaderboardMilestone {
    description: string;
    target: number;
}

export interface LeaderboardProgress {
    event: string;
    count: number;
    milestones: LeaderboardMilestone[];
}