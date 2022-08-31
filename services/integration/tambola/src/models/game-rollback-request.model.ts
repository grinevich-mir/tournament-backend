export interface GameRollbackRequestModel {
    token: string;
    transactionId: string;
    gameId: string;
    playerId: string;
    externalTransactionId: string;
    reason: string;
    numberOfTickets: number;
    totalAmount: number;
}