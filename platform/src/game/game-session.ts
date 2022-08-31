import { GameSessionStatus } from './game-session-status';
import { GameProvider } from './game-provider';
import { GameSessionMetadata } from './game-session-metadata';

export interface GameSession {
    id: number;
    secureId: string;
    status: GameSessionStatus;
    userId: number;
    gameId: number;
    reference?: string;
    provider: GameProvider;
    currencyCode: string;
    language: string;
    metadata: GameSessionMetadata;
    expireTime: Date;
    createTime: Date;
    updateTime: Date;
}