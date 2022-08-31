import { GameRequest, GameSessionState } from './common';

export interface GameAuthRequestModel extends GameRequest {
    token: string;
    gameId: string;
    channel: number;
    ip: string;
    launchVars: any;
    date: number;
}

export interface GameAuthResponseModel {
    playerId: string;
    currency: string;
    language?: string;
    nickname: string;
    balance: number;
    license: string;
    countryCode: string;
    sessionState?: GameSessionState;
    brand?: string;
}
