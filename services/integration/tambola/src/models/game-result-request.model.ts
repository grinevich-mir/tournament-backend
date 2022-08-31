interface WinnerModel {
    token: string;
    call: number;
    prizeAllocation: number;
}

interface GameWinnersModel {
    [key: string]: WinnerModel[];
}

export interface GameResultRequestModel {
    gameId: string;
    ballSequence: number[];
    finalCall: number;
    winners: GameWinnersModel;
}
