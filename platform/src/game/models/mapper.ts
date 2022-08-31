import { Singleton } from '../../core/ioc';
import { GameModel } from './game.model';
import { Game } from '../game';
import { GameType } from '../game-type';
import { GameProvider } from '../game-provider';
import { GameMetadata } from '../game-metadata';

@Singleton
export class GameModelMapper {
    public map(source: Game, metadataOverride?: GameMetadata): GameModel {
        const model: GameModel = {
            id: source.id,
            name: source.name,
            type: GameType[source.type],
            provider: GameProvider[source.provider],
            thumbnail: source.thumbnail,
            orientation: source.orientation,
            metadata: source.metadata,
            aspectRatioMobile: source.aspectRatioMobile,
            aspectRatioDesktop: source.aspectRatioDesktop
        };

        if (metadataOverride)
            model.metadata = Object.assign({}, model.metadata || {}, metadataOverride);

        return model;
    }
}