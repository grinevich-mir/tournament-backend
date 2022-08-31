import { GameMode } from './game-mode';

export interface GameResultsModel {
    [key: string]: number;
}

export interface GameResultRequestModel {
    gameId: number;
    gameMode?: GameMode;
    timestamp: number;
    numWinners: number;
    participants: number;
    results?: GameResultsModel;
}
