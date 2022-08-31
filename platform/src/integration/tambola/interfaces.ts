export interface LobbyPrizesConfig {
    [position: string]: number;
}

export interface JackpotConfig {
    potValue: number;
    trigger: 0 | 1 | 2;
    threshold: number;
}

export interface LobbyConfig {
    name: string;
    startTime: string;
    type: 0 | 1;
    callFrequencySeconds: number;
    minPlayers: number;
    maxPlayers: number;
    ticketPrice: number;
    minTicketsPerPlayer: number;
    maxTicketsPerPlayer: number;
    mode: 0 | 1;
    freeTickets: number;
    currency_iso: string;
    jackpot?: JackpotConfig;
    prizes: LobbyPrizesConfig;
}

export interface CreateLobbyRequest {
    gameId?: string;
    config: LobbyConfig;
}

export interface CreateLobbyResponse {
    gameId: string;
}

export interface GetPatternsResponse {
    patterns: PatternMap;
}

export interface PatternMap {
    [name: string]: Pattern;
}

export interface Pattern {
    name: string;
    patterns: number[][];
}

export enum BingoGameState {
    GAME_PREPARING = 1,
    PLAY = 2,
    GAME_END = 3
}