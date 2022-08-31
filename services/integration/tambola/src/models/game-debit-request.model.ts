export interface GameDebitRequestModel {
    token: string;
    transactionId: string;
    gameId: string;
    playerId: string;
    roundId: string;
    numberOfTickets: number;
    totalAmount: number;
}