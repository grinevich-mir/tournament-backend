import { DeviceType } from '../../core';
import { GameSession } from '../game-session';
import { Game } from '../game';

export interface GameUrlResolver {
    resolve(game: Game, session: GameSession, deviceType?: DeviceType): Promise<string>;
}