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

export interface GamePrizeLadderItem {
    roundNumber: number;
    prizeAmount: number;
}

export interface LobbyConfig {
    name?: string;
    startTime: number;
    prizeAmount: number;
    currency: string;
    minPlayerCount: number;
    maxPlayerCount: number;
    startBalance?: number;
    cardDecks?: number;
    roundDuration: number;
    betDuration: number;
    playDuration: number;
    padDuration: number;
    cutOffTime: number;
    maxRounds?: number;
    endTime?: number;
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

export enum CardSuit {
    SPADE = 0,
    CLUB = 1,
    DIAMOND = 2,
    HEART = 3,
}

export interface Card {
    suit: CardSuit;
    number: number;
}

export enum GameAction {
    HIT = 0,
    STAND = 1,
    BET = 2,
}

export interface GameMove {
    action: GameAction;
    card?: Card;
    amount?: number;
}

export interface GameResponse {
    operatorId: string;
    gameId: number;
    name: string;
    moves: GameMove[];
    startTime: number;
    prizeAmount?: number;
    currency: string;
    participants: number;
    minPlayers: number;
    maxPlayers: number;
    roundDuration: number;
    cutOffTime: number;
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
    knockedOut: boolean;
    token: string;
    sessionToken: string;
    prizeAmount?: number;
    round: number;
    lastMoveTime?: number;
}