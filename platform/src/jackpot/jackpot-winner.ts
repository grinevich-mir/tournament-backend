export interface JackpotWinner {
    id: string;
    userId: number;
    jackpotId: number;
    jackpotName: string;
    jackpotLabel: string;
    amount: number;
    date: Date;
}