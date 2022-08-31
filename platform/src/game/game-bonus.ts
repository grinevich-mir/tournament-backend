import { GameProvider } from './game-provider';

export interface GameBonus {
    id: number;
    userId: number;
    gameId: number;
    reference?: string;
    provider: GameProvider;
    providerRef: string;
    createTime: Date;
}