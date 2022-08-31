export interface GameCreditRequestModel {
    token: string;
    transactionId: string;
    gameId: string;
    playerId: string;
    roundId: string;
    numberOfTickets: number;
    amount: number;
}