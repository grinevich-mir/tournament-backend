import { GameTransactionStatus } from './game-transaction-status';
import { Nullable, GameRequest, GameSessionState } from './common';

export interface GameDebitAndCreditRequestModel extends GameRequest {
    playerId: string;
    gameId: string;
    transactionId: string;
    currency: string;
    roundId: string;
    channel: number;
    debitAmount: number;
    creditAmount: number;
    sessionState?: GameSessionState;
    date: number;
    additionalData?: any;
    campaignType?: 'FREESPIN' | 'TOURNAMENT';
    awardId?: string;
    transactionProviderPrefix?: string;
}

export interface GameDebitAndCreditResponseModel {
    transactionId: Nullable<string>;
    transactionStatus: GameTransactionStatus;
    balance: number;
}