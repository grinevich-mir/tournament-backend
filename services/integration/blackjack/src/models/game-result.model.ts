export interface GameResultsModel {
    [key: string]: number;
}

export interface GameResultRequestModel {
    gameId: number;
    timestamp: number;
    numWinners: number;
    participants: number;
    results?: GameResultsModel;
}
