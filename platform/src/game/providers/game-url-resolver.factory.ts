import { Singleton, IocContainer } from '../../core/ioc';
import { GameUrlResolver } from './game-url-resolver';
import { GameProvider } from '../game-provider';
import { RevolverGameUrlResolver } from './revolver';
import { Game } from '../game';
import { LogClass } from '../../core/logging';
import { PlaytechGameUrlResolver } from './playtech';

@Singleton
@LogClass()
export class GameUrlResolverFactory {
    public create(game: Game): GameUrlResolver {
        switch (game.provider) {
            case GameProvider.Revolver:
                return IocContainer.get(RevolverGameUrlResolver);

            case GameProvider.Playtech:
                return IocContainer.get(PlaytechGameUrlResolver);
        }

        throw new Error(`Game provider '${game.provider}' not supported.`);
    }
}