export enum GameState {
    Scheduled = 1,
    Launching = 2,
    Waiting = 3,
    Running = 4,
    Finalising = 5,
    Ended = 6,
    Cancelled = 7,
    Failed = 8
}

export enum GameTier {
    FREE = 0,
    BRONZE = 1,
    SILVER = 2,
    GOLD = 3,
    PLATINUM = 4
}

export enum GameDirection {
    LOWER  = 0,
    HIGHER = 1
}

export interface GamePrizeLadderItem {
    roundNumber: number;
    prizeAmount: number;
}

export interface LobbyConfig {
    mode: number;
    startTime: number;
    endTime?: number;
    minPlayerCount: number;
    maxPlayerCount: number;
    currency: string;
    prizeAmount: number;
    roundDuration: number;
    minNumber?: number;
    maxNumber?: number;
    testMode?: boolean;
    cutOffTime: number;
    maxWinners?: number;
    maxRounds?: number;
    livesPerEntry?: number;
    pointsPerRound?: number;
    prizeLadder?: GamePrizeLadderItem[];
    chips?: number[];
    multipliers?: number[];
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

export interface GameResponse {
    operatorId: string;
    gameId: number;
    name: string;
    startTime: number;
    prizeAmount: number;
    currency: string;
    participants: number;
    minPlayers: number;
    maxPlayers: number;
    roundDurationSeconds: number;
    roundNumber: number;
    numUpPlayers: number;
    numDownPlayers: number;
    numbers: number[];
    cutOffTime: number;
    remainingPlayerCount: number;
    tier: GameTier;
    state: GameState;
    enabled: boolean;
    maxWinners?: number;
    maxRounds?: number;
}

export interface GameEntryResponse {
    playerId: string;
    playerNickname: string;
    operatorId: string;
    gameId: number;
    moves: GameDirection[];
    knockedOut: boolean;
    token: string;
    sessionToken: string;
    prizeAmount?: number;
    createTime: Date;
}

export enum GameMode {
    Standard = 0,
    Leaderboard = 1,
    Perpetual = 2,
    Roulette = 3
}
