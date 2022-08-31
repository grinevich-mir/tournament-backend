import { GameEntity } from '../game.entity';
import { Game } from '../../game';
import { Singleton } from '../../../core/ioc';

@Singleton
export class GameEntityMapper {
    public fromEntity(source: GameEntity): Game {
        return {
            id: source.id,
            name: source.name,
            provider: source.providerId,
            providerRef: source.providerRef,
            aspectRatioDesktop: source.aspectRatioDesktop,
            aspectRatioMobile: source.aspectRatioMobile,
            metadata: source.metadata,
            type: source.typeId,
            enabled: source.enabled,
            thumbnail: source.thumbnail,
            orientation: source.orientation,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}