export interface RevolverPlayer {
    rgsId: number;
    externalId: number;
    currency: string;
    currencyExchangeRateToBaseCurrency: number;
    nickName: string;
    channel: string;
    sessionState?: {
        sessionId?: string;
        [key: string]: any;
    };
}

export interface RevolverOperator {
    name: string;
    operatorId: string;
    brand: string;
}

export interface RevolverGame {
    gameId: number;
    uuid: string;
    name: string;
    metaData?: any;
}

export interface RevolverEngineResolverOutcomeDataWinsDetail {
    symbol: string;
    credits: number;
    oak: number;
    positions: number[];
    type: string;
    cash: number;
    line: number;
}

export interface RevolverEngineResolverOutcomeDataWins {
    credits: number;
    multiplier: number;
    wildMultiplier: number;
    cash: number;
    details: RevolverEngineResolverOutcomeDataWinsDetail[];
}

export interface RevolverEngineResultOutcomeData {
    version: string;
    aperture: string[][];
    multiplier: number;
    freeSpinsCount: number;
    wins?: RevolverEngineResolverOutcomeDataWins;
}

export interface RevolverEngineResultTriggeredBonusGame {
    game: string;
    rounds: number;
    is_complete: false;
    total_win_cash: number;
    spin_pending: false;
}

export interface RevolverEngineResultGameState {
    game: string;
    rounds: number;
    is_complete: boolean;
}

export interface RevolverEngineResultBetState {
    coin_level: number;
    bet_level: number;
    lines: number;
}

export interface RevolverEngineResult {
    totalWinCash: number;
    totalBetCash: number;
    triggeredBonusGames: { [key: string]: RevolverEngineResultTriggeredBonusGame };
    isGameComplete: boolean;
    isRiskGameOutcome: boolean;
    evaluationOutComeData: RevolverEngineResultOutcomeData;
    gameState: RevolverEngineResultGameState;
    betState: RevolverEngineResultBetState;
    progressData?: any;
    updatedParentGameState?: any;
    visibleAperture?: any;
}

export interface RevolverGameRound {
    roundId: number;
    currentlyEvaluatedSubGameName: string;
    engineResult: RevolverEngineResult;
    bonusGamesStack?: any;
}

export interface RevolverEvent {
    time: Date;
    player: RevolverPlayer;
    operator: RevolverOperator;
    game: RevolverGame;
    round: RevolverGameRound;
    campaign?: any;
    jackpot?: any;
}