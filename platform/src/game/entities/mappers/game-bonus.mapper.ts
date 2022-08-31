import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { GameBonus } from '../../game-bonus';
import { NewGameBonus } from '../../new-game-bonus';
import { GameBonusEntity } from '../game-bonus.entity';

@Singleton
@LogClass()
export class GameBonusEntityMapper {
    public newToEntity(source: NewGameBonus): GameBonusEntity {
        const entity = new GameBonusEntity();
        entity.userId = source.userId;
        entity.gameId = source.gameId;
        entity.reference = source.reference;
        entity.providerId = source.provider;
        entity.providerRef = source.providerRef;
        return entity;
    }

    public fromEntity(source: GameBonusEntity): GameBonus {
        return {
            id: source.id,
            gameId: source.gameId,
            provider: source.providerId,
            providerRef: source.providerRef,
            userId: source.userId,
            reference: source.reference,
            createTime: source.createTime
        };
    }
}