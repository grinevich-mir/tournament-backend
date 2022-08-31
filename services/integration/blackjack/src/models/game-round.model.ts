export interface GameRoundResultModel {
    timeTaken: number;
    points?: number;
    knockout?: boolean;
    complete?: boolean;
}

export interface GameRoundResultsModel {
    [key: string]: GameRoundResultModel;
}

export interface GameRoundRequestModel {
    gameId: number;
    round: number;
    lastRound?: boolean;
    results: GameRoundResultsModel;
}