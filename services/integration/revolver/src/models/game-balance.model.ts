import { GameRequest, GameSessionState } from './common';

export interface GameBalanceRequestModel extends GameRequest {
    playerId: string;
    currency: string;
    gameId: string;
    sessionState?: GameSessionState;
    timeout?: number;
    date: number;
}

export interface GameBalanceResponseModel {
    balance: number;
    sessionState?: GameSessionState;
}