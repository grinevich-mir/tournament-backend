export interface GameCreditRequestModel {
    gameId: string;
    token: string;
    transactionId: string;
    amount: number;
    currency: string;
}

export interface GameCreditResponseModel {
    transactionId: string;
}