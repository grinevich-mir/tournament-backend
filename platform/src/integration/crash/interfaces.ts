export enum GameState {
    Scheduled = 1,
    Launching = 2,
    Waiting = 3,
    Running = 4,
    Finalising = 5,
    Ended = 6,
    Cancelled = 7,
    Failed = 8,
}

export interface LobbyConfig {
    name?: string;
    startTime: number;
    prizeAmount: number;
    currency: string;
    minPlayerCount: number;
    maxPlayerCount: number;
    maxRoundDuration: number;
    cutOffTime: number;
    maxRounds?: number;
    endTime?: number;
    extremeValue?: number;
    houseEdge?: number;
    safeTime?: number;
    livesPerEntry?: number;
}

export interface CreateLobbyRequest {
    gameId: string;
    config: LobbyConfig;
}

export interface CreateLobbyResponse {
    gameId: string;
}

export interface AuditResponse {
    operatorId: string;
    gameId: number;
    playerId: string;
    event: string;
    data?: any;
    createTime: Date;
}

export interface GameMove {
    moveTime: number;
    multiplier: number;
}

export interface GameResponse {
    operatorId: string;
    gameId: number;
    name: string;
    startTime: number;
    prizeAmount?: number;
    currency: string;
    minPlayerCount: number;
    maxPlayerCount: number;
    roundDuration: number;
    cutOffTime: number;
    numbers: number[];
    state: GameState;
    enabled: boolean;
    taskId?: string;
    maxRounds?: number;
    endTime?: number;
}

export interface GameEntryResponse {
    playerId: string;
    displayName: string;
    operatorId: string;
    gameId: number;
    moves: GameMove[];
    token: string;
    sessionToken: string;
    balance: number;
    round: number;
}