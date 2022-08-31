import { Singleton } from '../../../core/ioc';
import { GameUrlResolver } from '../game-url-resolver';
import { DeviceType } from '../../../core';
import { GameSession } from '../../game-session';
import { Game } from '../../game';
import { LogClass } from '../../../core/logging';


@Singleton
@LogClass()
export class PlaytechGameUrlResolver implements GameUrlResolver {
    public async resolve(game: Game, _session: GameSession, _deviceType?: DeviceType): Promise<string> {
        return `https://cachedownload.playtechone.com/casinoclient.html?game=${game.providerRef}&preferedmode=offline&ngm=1&language=en`;
    }
}