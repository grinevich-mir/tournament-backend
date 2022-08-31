import { GameProvider } from './game-provider';
import { GameType } from './game-type';
import { GameMetadata } from './game-metadata';
import { GameOrientation } from './game-orientation';

export interface Game {
    id: number;
    name: string;
    type: GameType;
    provider: GameProvider;
    providerRef?: string;
    thumbnail: string;
    orientation: GameOrientation;
    metadata?: GameMetadata;
    aspectRatioMobile?: number;
    aspectRatioDesktop?: number;
    enabled: boolean;
    createTime: Date;
    updateTime: Date;
}