import { GameProvider } from './game-provider';
import { GameSessionMetadata } from './game-session-metadata';

export interface NewGameSession {
    userId: number;
    gameId: number;
    reference?: string;
    provider: GameProvider;
    currencyCode: string;
    language: string;
    metadata?: GameSessionMetadata;
}