import { GameTransactionStatus } from './game-transaction-status';
import { Nullable, GameRequest, GameSessionState } from './common';

export interface GameDebitRequestModel extends GameRequest {
    playerId: string;
    gameId: string;
    currency: string;
    roundId: string;
    channel: number;
    transactionId: string;
    amount: number;
    isRoundFinished?: boolean;
    sessionState?: GameSessionState;
    date: number;
    additionalData?: any;
    campaignType?: 'FREESPIN' | 'TOURNAMENT';
    awardId?: string;
    transactionProviderPrefix?: string;
}

export interface GameDebitResponseModel {
    transactionId: Nullable<string>;
    transactionStatus: GameTransactionStatus;
    balance: number;
}