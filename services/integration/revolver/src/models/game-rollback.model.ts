import { GameTransactionStatus } from './game-transaction-status';
import { Nullable, GameRequest, GameSessionState } from './common';

export interface GameRollbackRequestModel extends GameRequest {
    playerId: string;
    gameId: string;
    currency: string;
    roundId: string;
    transactionId: string | number;
    amount?: number;
    debitAmount?: number;
    creditAmount?: number;
    reason: string;
    relatedExternalDebitTransactionId?: string | null;
    sessionState?: GameSessionState;
    transactionProviderPrefix?: string;
    additionalData?: any;
    date: number;
}

export interface GameRollbackResponseModel {
    transactionId: Nullable<string>;
    transactionStatus: GameTransactionStatus;
    balance: number;
}