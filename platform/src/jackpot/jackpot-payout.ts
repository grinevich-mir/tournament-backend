export interface JackpotPayout {
    id: number;
    jackpotId: number;
    userId: number;
    amount: number;
    walletEntryId: number;
    createTime: Date;
}