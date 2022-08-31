export interface JackpotWinnerModel {
    id: string;
    displayName: string;
    jackpotId: number;
    jackpotName: string;
    jackpotLabel: string;
    avatarUrl?: string;
    country: string;
    isPlayer: boolean;
    amount: number;
    date: Date;
}