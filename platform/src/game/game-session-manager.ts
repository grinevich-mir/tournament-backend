import { Singleton, Inject } from '../core/ioc';
import { GameSessionMetadata } from './game-session-metadata';
import { GameSessionRepository } from './repositories';
import { NotFoundError, ForbiddenError, DeviceType } from '../core';
import { GameSessionStatus } from './game-session-status';
import { GameUrlResolverFactory } from './providers';
import moment from 'moment';
import Logger, { LogClass } from '../core/logging';
import { NewGameSession } from './new-game-session';
import { GameSession } from './game-session';
import { Game } from './game';
import { GameManager } from './game-manager';
import { GameSessionEntityMapper } from './entities/mappers';
import { GameSessionCache } from './cache';
import { SingleGameSessionFilter } from './game-session-filter';
import { GameBonusManager } from './game-bonus-manager';
import { SESSION_EXPIRE_MINS } from './constants';

export interface GameSessionStartResult {
    game: Game;
    session: GameSession;
    redirectUrl: string;
}

@Singleton
@LogClass()
export class GameSessionManager {
    constructor(
        @Inject private readonly cache: GameSessionCache,
        @Inject private readonly gameManager: GameManager,
        @Inject private readonly sessionRepository: GameSessionRepository,
        @Inject private readonly urlResolverFactory: GameUrlResolverFactory,
        @Inject private readonly entityMapper: GameSessionEntityMapper,
        @Inject private readonly bonusManager: GameBonusManager) {
        }

    public async add(newSession: NewGameSession): Promise<GameSession> {
        const game = await this.gameManager.get(newSession.gameId);

        if (!game)
            throw new NotFoundError('Game not found.');

        if (!game.enabled)
            throw new ForbiddenError('Game is unavailable.');

        return this.addInternal(newSession);
    }

    public async start(gameId: number, userId: number, currencyCode: string, language: string, metadata?: GameSessionMetadata, deviceType?: DeviceType): Promise<GameSessionStartResult> {
        const game = await this.gameManager.get(gameId);

        if (!game)
            throw new NotFoundError('Game not found.');

        if (!game.enabled)
            throw new ForbiddenError('Game is unavailable.');

        const existingEntity = await this.sessionRepository.getByGameId(userId, gameId, {
            currencyCode,
            statuses: [GameSessionStatus.Created, GameSessionStatus.Active],
            expired: false
        });

        if (existingEntity) {
            const existingSession = this.entityMapper.fromEntity(existingEntity);
            await this.bonusManager.invalidate(userId, gameId, existingSession.reference);
            return this.getResult(game, existingSession, deviceType);
        }

        const newSession: NewGameSession = {
            gameId,
            userId,
            provider: game.provider,
            currencyCode,
            language,
            metadata
        };

        const session = await this.addInternal(newSession);
        await this.bonusManager.invalidate(userId, gameId, newSession.reference);
        return this.getResult(game, session, deviceType);
    }

    public async getByReference(reference: string, filter?: SingleGameSessionFilter): Promise<GameSession | undefined> {
        const entity = await this.sessionRepository.getByReference(reference, filter);

        if (!entity)
            return undefined;

        return this.entityMapper.fromEntity(entity);
    }

    public async resume(id: number | string, deviceType?: DeviceType): Promise<GameSessionStartResult> {
        let session: GameSession | undefined;

        if (typeof id === 'string')
            session = await this.getBySecureId(id);
        else
            session = await this.get(id);

        if (!session)
            throw new NotFoundError('Session not found.');

        if (moment(session.expireTime).isSameOrBefore() || [GameSessionStatus.Closed, GameSessionStatus.Expired].includes(session.status))
            throw new ForbiddenError('Session has expired.');

        const game = await this.gameManager.get(session.gameId);

        if (!game)
            throw new NotFoundError('Game not found.');

        if (!game.enabled)
            throw new ForbiddenError('Game is unavailable.');

        await this.bonusManager.invalidate(session.userId, session.gameId, session.reference);
        return this.getResult(game, session, deviceType);
    }

    public async get(id: number): Promise<GameSession | undefined> {
        const cachedSession = await this.cache.get(id);

        if (cachedSession)
            return cachedSession;

        const entity = await this.sessionRepository.get(id);

        if (!entity)
            return undefined;

        const session = this.entityMapper.fromEntity(entity);
        await this.cache.store(session);
        return session;
    }

    public async getBySecureId(secureId: string): Promise<GameSession | undefined> {
        const cachedSession = await this.cache.get(secureId);

        if (cachedSession)
            return cachedSession;

        const entity = await this.sessionRepository.getBySecureId(secureId);

        if (!entity)
            return undefined;

        const session = this.entityMapper.fromEntity(entity);
        await this.cache.store(session);
        return session;
    }

    public async setStatus(id: number, status: GameSessionStatus): Promise<void> {
        const session = await this.get(id);

        if (!session)
            return;

        const newExpiration = await this.sessionRepository.setStatus(id, status);

        session.status = status;
        session.updateTime = new Date();
        session.expireTime = newExpiration;
        await this.cache.store(session);
    }

    public async extend(id: number): Promise<void> {
        const session = await this.get(id);

        if (!session)
            return;

        const newExpiration = await this.sessionRepository.extend(id);
        session.updateTime = new Date();
        session.expireTime = newExpiration;
        await this.cache.store(session);
    }

    public async setExpiredStatuses(): Promise<void> {
        const expired = await this.sessionRepository.getForExpiration();

        if (expired.length === 0) {
            Logger.info('No sessions to set Expired status on.');
            return;
        }

        Logger.info(`Setting expired status on ${expired.length} session(s)...`);
        const ids = expired.map(e => e.id);
        await this.sessionRepository.setStatuses(ids, GameSessionStatus.Expired);
        await this.cache.remove(...ids);
    }

    private async addInternal(newSession: NewGameSession): Promise<GameSession> {
        const entity = this.entityMapper.newSessionToEntity(newSession);
        entity.expireTime = moment.utc().add(SESSION_EXPIRE_MINS, 'minutes').toDate();
        const createdSession = await this.sessionRepository.add(entity);
        const session = this.entityMapper.fromEntity(createdSession);
        await this.cache.store(session);
        return session;
    }

    private async getResult(game: Game, session: GameSession, deviceType?: DeviceType): Promise<GameSessionStartResult> {
        const resolver = this.urlResolverFactory.create(game);
        const redirectUrl = await resolver.resolve(game, session, deviceType);

        return {
            game,
            session,
            redirectUrl
        };
    }
}