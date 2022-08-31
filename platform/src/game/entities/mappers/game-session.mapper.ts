import { Singleton } from '../../../core/ioc';
import { GameSession } from '../../game-session';
import { GameSessionEntity } from '../game-session.entity';
import { NewGameSession } from '../../new-game-session';

@Singleton
export class GameSessionEntityMapper {
    public newSessionToEntity(source: NewGameSession): GameSessionEntity {
        const entity = new GameSessionEntity();
        entity.userId = source.userId;
        entity.gameId = source.gameId;
        entity.providerId = source.provider;
        entity.currencyCode = source.currencyCode;
        entity.language = source.language;
        entity.reference = source.reference;

        if (source.metadata)
            entity.metadata = source.metadata;

        return entity;
    }

    public fromEntity(source: GameSessionEntity): GameSession {
        return {
            id: source.id,
            secureId: source.secureId,
            gameId: source.gameId,
            expireTime: source.expireTime,
            provider: source.providerId,
            currencyCode: source.currencyCode,
            reference: source.reference,
            status: source.status,
            userId: source.userId,
            createTime: source.createTime,
            updateTime: source.updateTime,
            language: source.language,
            metadata: source.metadata
        };
    }
}