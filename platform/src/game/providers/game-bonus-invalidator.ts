import { GameBonus } from '../game-bonus';

export interface GameBonusInvalidator {
    invalidate(session: GameBonus): Promise<void>;
}