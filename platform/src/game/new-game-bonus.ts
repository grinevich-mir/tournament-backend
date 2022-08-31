import { GameProvider } from './game-provider';

export interface NewGameBonus {
    userId: number;
    gameId: number;
    provider: GameProvider;
    providerRef: string;
    reference?: string;
}