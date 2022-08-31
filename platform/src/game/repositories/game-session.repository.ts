import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { GameSessionEntity } from '../entities/game-session.entity';
import { GameSessionStatus } from '../game-session-status';
import moment from 'moment';
import { FindOneOptions, Raw, FindConditions, In, FindManyOptions, Not } from 'typeorm';
import { LogClass } from '../../core/logging';
import { SingleGameSessionFilter } from '../game-session-filter';
import { SESSION_EXPIRE_MINS } from '../constants';

@Singleton
@LogClass()
export class GameSessionRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async get(id: number): Promise<GameSessionEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(GameSessionEntity, id);
    }

    public async getBySecureId(secureId: string): Promise<GameSessionEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(GameSessionEntity, {
            where: { secureId }
        });
    }

    public async getByGameId(userId: number, gameId: number, filter?: SingleGameSessionFilter): Promise<GameSessionEntity | undefined> {
        const connection = await this.db.getConnection();

        const where: FindConditions<GameSessionEntity> = {
            userId,
            gameId
        };
        const options: FindOneOptions<GameSessionEntity> = {
            where
        };

        if (filter) {
            if (filter.currencyCode)
                where.currencyCode = filter.currencyCode;

            if (filter.statuses)
                where.status = In(filter.statuses);

            if (filter.expired === true)
                where.expireTime = Raw(alias => `${alias} <= CURRENT_TIMESTAMP`);
            else if (filter.expired === false)
                where.expireTime = Raw(alias => `${alias} > CURRENT_TIMESTAMP`);
        }

        return connection.manager.findOne(GameSessionEntity, options);
    }

    public async getByReference(reference: string, filter?: SingleGameSessionFilter): Promise<GameSessionEntity | undefined> {
        const connection = await this.db.getConnection();

        const where: FindConditions<GameSessionEntity> = {
            reference
        };
        const options: FindOneOptions<GameSessionEntity> = {
            where
        };

        if (filter) {
            if (filter.currencyCode)
                where.currencyCode = filter.currencyCode;

            if (filter.statuses)
                where.status = In(filter.statuses);

            if (filter.expired === true)
                where.expireTime = Raw(alias => `${alias} <= CURRENT_TIMESTAMP`);
            else if (filter.expired === false)
                where.expireTime = Raw(alias => `${alias} > CURRENT_TIMESTAMP`);
        }

        return connection.manager.findOne(GameSessionEntity, options);
    }

    public async getForExpiration(): Promise<GameSessionEntity[]> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<GameSessionEntity> = {
            where: {
                expireTime: Raw(alias => `${alias} <= CURRENT_TIMESTAMP`),
                status: Not(In([GameSessionStatus.Expired, GameSessionStatus.Closed]))
            }
        };

        return connection.manager.find(GameSessionEntity, options);
    }

    public async add(session: GameSessionEntity): Promise<GameSessionEntity> {
        const connection = await this.db.getConnection();
        delete (session as any).id;
        delete (session as any).secureId;
        return connection.manager.save(session);
    }

    public async setStatus(id: number, status: GameSessionStatus): Promise<Date> {
        const connection = await this.db.getConnection();

        let expireTime = moment().utc().add(SESSION_EXPIRE_MINS, 'minutes').toDate();

        if ([GameSessionStatus.Closed, GameSessionStatus.Expired].includes(status))
            expireTime = moment().utc().toDate();

        const data: Partial<GameSessionEntity> = {
            status,
            expireTime
        };

        await connection.manager.update(GameSessionEntity, id, data);
        return expireTime;
    }

    public async setStatuses(ids: number[], status: GameSessionStatus): Promise<void> {
        const connection = await this.db.getConnection();

        let expireTime = moment().utc().add(SESSION_EXPIRE_MINS, 'minutes').toDate();

        if ([GameSessionStatus.Closed, GameSessionStatus.Expired].includes(status))
            expireTime = moment().utc().toDate();

        const data: Partial<GameSessionEntity> = {
            status,
            expireTime
        };

        const criteria = {
            id: In(ids)
        };

        await connection.manager.update(GameSessionEntity, criteria, data);
    }

    public async extend(id: number): Promise<Date> {
        const connection = await this.db.getConnection();
        const expireTime = moment().utc().add(SESSION_EXPIRE_MINS, 'minutes').toDate();

        const data: Partial<GameSessionEntity> = {
            expireTime
        };

        await connection.manager.update(GameSessionEntity, id, data);
        return expireTime;
    }
}