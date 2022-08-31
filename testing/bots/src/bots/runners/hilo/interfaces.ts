export interface JoinResponse {
    mode: 0 | 1;
    startTime: number;
    roundNumber: number;
    roundDurationSeconds: number;
    nextRoundStartTime: number;
    cutOffTime: number;
    userToken: string;
    minNumber: number;
    maxNumber: number;
    livesPerEntry: number;
    livesCount: number;
    inPlay: boolean;
}

export interface RoundResponse {
    userToken: string;
    nextRoundStartTime: number;
    numParticipantsRemaining: number;
    currentNumber: number;
    winners?: any[];
}

export interface PlayResponse {
    userToken: string;
}