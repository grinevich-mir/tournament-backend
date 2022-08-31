export interface TopWinnerModel {
    rank: number;
    displayName: string;
    winnings: number;
    isPlayer: boolean;
    country?: string;
    avatarUrl?: string;
}