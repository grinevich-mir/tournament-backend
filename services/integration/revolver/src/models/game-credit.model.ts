import { GameTransactionStatus } from './game-transaction-status';
import { Nullable, GameRequest, GameSessionState } from './common';

export interface GameCreditRequestModel extends GameRequest {
    playerId: string;
    gameId: string;
    currency: string;
    roundId: string;
    channel: number;
    transactionId: string;
    amount: number;
    isRoundFinished?: boolean;
    relatedExternalDebitTransactionId?: string;
    sessionState?: GameSessionState;
    date: number;
    additionalData?: any;
    campaignType?: 'FREESPIN' | 'TOURNAMENT';
    awardId?: string;
    transactionProviderPrefix?: string;
}

export interface GameCreditResponseModel {
    transactionId: Nullable<string>;
    transactionStatus: GameTransactionStatus;
    balance: number;
}