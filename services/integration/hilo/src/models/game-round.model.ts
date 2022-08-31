import { GameMode } from './game-mode';

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
    gameMode?: GameMode;
    round: number;
    lastRound?: boolean;
    results: GameRoundResultsModel;
}