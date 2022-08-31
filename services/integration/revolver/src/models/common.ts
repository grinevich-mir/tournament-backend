export type Nullable<T> = T | null;

export interface GameRequest {
    sign: string;
}

export interface GameSessionState {
    [key: string]: any;
    sessionId?: string;
}

export enum CustomErrorResponseType {
    InsuffientCredit,
    InsufficientRounds,
    EntryComplete,
    TournamentNotStarted,
    TournamentFinished
}