import { Inject, Singleton } from '../core/ioc';
import { LogClass } from '../core/logging';
import { NewGameBonus } from './new-game-bonus';
import { GameBonusInvalidatorFactory } from './providers';
import { GameBonusRepository } from './repositories';

@Singleton
@LogClass()
export class GameBonusManager {
    constructor(
        @Inject private readonly repository: GameBonusRepository,
        @Inject private readonly invalidatorFactory: GameBonusInvalidatorFactory) {
        }

    public async add(bonus: NewGameBonus): Promise<void> {
        await this.repository.add(bonus);
    }

    public async invalidate(userId: number, gameId: number, excludeReference?: string): Promise<void> {
        let bonuses = await this.repository.get(userId, gameId);

        if (bonuses.length === 0)
            return;

        if (excludeReference)
            bonuses = bonuses.filter(s => s.reference !== excludeReference);

        for (const bonus of bonuses) {
            const invalidator = this.invalidatorFactory.create(bonus.provider);
            await invalidator.invalidate(bonus);
            await this.repository.remove(bonus.id);
        }
    }
}