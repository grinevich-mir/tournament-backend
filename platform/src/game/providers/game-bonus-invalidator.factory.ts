import { IocContainer, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { GameProvider } from '../game-provider';
import { GameBonusInvalidator } from './game-bonus-invalidator';
import { RevolverGameBonusInvalidator } from './revolver';

@Singleton
@LogClass()
export class GameBonusInvalidatorFactory {
    public create(provider: GameProvider): GameBonusInvalidator {
        switch (provider) {
            case GameProvider.Revolver:
                return IocContainer.get(RevolverGameBonusInvalidator);
        }

        throw new Error(`Game provider ${provider} is not supported.`);
    }
}