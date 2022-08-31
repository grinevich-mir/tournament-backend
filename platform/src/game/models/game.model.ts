import { GameMetadata } from '../game-metadata';
import { GameOrientation } from '../game-orientation';

export interface GameModel {
    /**
     * @isInt id
     */
    id: number;
    name: string;
    /**
     * @isInt typeId
     */
    type: string;
    provider: string;
    thumbnail: string;
    orientation: GameOrientation;
    metadata?: GameMetadata;
    aspectRatioMobile?: number;
    aspectRatioDesktop?: number;
}