import { GlobalDB, transactionRetry } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { UserEntity, UserIpEntity } from '../entities';
import { FindManyOptions, FindConditions, Like, Between, Raw } from 'typeorm';
import { UserVerificationStatus } from '../user-verification-status';
import { UserFilter } from '../user-filter';
import { LogClass } from '../../core/logging';
import { PagedResult, GeoIpInfo } from '../../core';
import { UserAddressStatus } from '../user-address-status';
import { UserType } from '../user-type';
import { UserMetadata } from '../user-metadata';

@Singleton
@LogClass()
export class UserRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(filter?: UserFilter): Promise<PagedResult<UserEntity>> {
        const connection = await this.db.getConnection();

        const options: FindManyOptions<UserEntity> = {
            relations: ['avatar', 'profile'],
            order: {
                createTime: 'ASC'
            }
        };

        if (filter) {
            options.where = {};

            if (filter.type)
                options.where.type = filter.type;

            if (filter.enabled !== undefined)
                options.where.enabled = filter.enabled;

            if (filter.subscribed !== undefined)
                options.where.subscribed = filter.subscribed;

            if (filter.subscribing !== undefined)
                options.where.subscribing = filter.subscribing;

            if (filter.page && filter.pageSize) {
                options.skip = (filter.page - 1) * filter.pageSize;
                options.take = filter.pageSize;
            }

            if (filter.order)
                options.order = filter.order;

            if (filter.regCountry)
                options.where.regCountry = filter.regCountry;

            if (filter.fields) {
                if (filter.fields.email)
                    options.where.id = Raw(() => `UserEntity__profile.email LIKE '%${filter.fields?.email}%'`);

                if (filter.fields.displayName)
                    options.where.displayName = Like(`%${filter.fields.displayName}%`);

                if (filter.fields.playedFrom && filter.fields.playedTo)
                    options.where.lastPlayed = Between(filter.fields.playedFrom, filter.fields.playedTo);

                if (filter.fields.lastUpdatedFrom && filter.fields.lastUpdatedTo)
                    options.where.updateTime = Between(filter.fields.lastUpdatedFrom, filter.fields.lastUpdatedTo);

                if (filter.fields.createdFrom && filter.fields.createdTo)
                    options.where.createTime = Between(filter.fields.createdFrom, filter.fields.createdTo);
            }
        }

        const [entities, count] = await connection.manager.findAndCount(UserEntity, options);

        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count;
        return new PagedResult(entities, count, page, pageSize);
    }

    public async get(id: number | string): Promise<UserEntity | undefined> {
        if (!id)
            throw new Error('ID missing.');

        const connection = await this.db.getConnection();

        if (typeof id === 'string')
            return connection.manager.findOne(UserEntity, { secureId: id }, { relations: ['avatar'] });
        else
            return connection.manager.findOne(UserEntity, id, { relations: ['avatar'] });
    }

    public async exists(id: number | string): Promise<boolean> {
        if (!id)
            throw new Error('ID missing.');

        const where: FindConditions<UserEntity> = {};

        if (typeof id === 'string')
            where.secureId = id;
        else
            where.id = id;

        const connection = await this.db.getConnection();
        const count = await connection.manager.count(UserEntity, { where });
        return count > 0;
    }

    public async add(entity: UserEntity): Promise<UserEntity> {
        const connection = await this.db.getConnection();
        delete (entity as any).id;
        const created = await connection.manager.save(UserEntity, entity);
        return await this.get(created.id) as UserEntity;
    }

    public async setEnabled(id: number, enabled: boolean): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { enabled });
    }

    public async setChatToken(id: number, accessToken: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { chatToken: accessToken });
    }

    public async updateLastPlayed(id: number, date: Date, consecutivePlayedDays: number): Promise<void> {
        const connection = await this.db.getConnection();
        await transactionRetry(connection, async manager => manager.update(UserEntity, id, {
            lastPlayed: date,
            consecutivePlayedDays
        })).execute();
    }

    public async updateIpAddress(id: number, ipAddress: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { ipAddress });
    }

    public async addIpData(id: number, ipAddress: string, geoip?: GeoIpInfo): Promise<void> {
        const connection = await this.db.getConnection();
        const entity = new UserIpEntity();
        entity.userId = id;
        entity.ipAddress = ipAddress;

        if (geoip) {
            entity.country = geoip.country;
            entity.city = geoip.city;
            entity.region = geoip.region;
            entity.regionCode = geoip.regionCode;
            entity.postalCode = geoip.postalCode;
            entity.latitude = geoip.latitude;
            entity.longitude = geoip.longitude;
        }

        await connection.manager.insert(UserIpEntity, entity);
    }

    public async getIpHistory(id: number): Promise<UserIpEntity[]> {
        const connection = await this.db.getConnection();
        return connection.manager.find(UserIpEntity, {
            where: {
                userId: id
            },
            order: {
                createTime: 'ASC'
            }
        });
    }

    public async getUsersByIp(ip: string): Promise<UserEntity[]> {
        const connection = await this.db.getConnection();
        return connection.manager.createQueryBuilder(UserEntity, 'user')
            .distinct(true)
            .innerJoin(UserIpEntity, 'ip', 'ip.userId = user.id')
            .where('ip.ipAddress = :ip', { ip })
            .getMany();
    }

    public async displayNameExists(displayName: string, requestingUserId: number): Promise<boolean> {
        const connection = await this.db.getConnection();
        const query = connection.createQueryBuilder(UserEntity, 'U');

        const count = await query
            .where('U.id != :requestingUserId AND U.displayName = :displayName', { requestingUserId, displayName })
            .getCount();

        return count > 0;
    }

    public async setDisplayName(id: number, displayName: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { displayName });
    }

    public async setAvatar(id: number, avatarId: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { avatarId, customAvatarId: null as any });
    }

    public async setCustomAvatar(id: number, avatarId: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { customAvatarId: avatarId });
    }

    public async setCurrency(id: number, currencyCode: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { currencyCode });
    }

    public async setCountry(id: number, country: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { country });
    }

    public async setRegLocation(id: number, country: string, state?: string): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, {
            country,
            regCountry: country,
            regState: state
        });
    }

    public async setIdentityStatus(id: number, status: UserVerificationStatus): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { identityStatus: status });
    }

    public async setAddressStatus(id: number, status: UserAddressStatus): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { addressStatus: status });
    }

    public async setLevel(id: number, level: number): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { level });
    }

    public async setSubscriptionState(id: number, values: { subscribed?: boolean, subscribing?: boolean; }): Promise<void> {
        const connection = await this.db.getConnection();

        if (!Object.keys(values).length)
            return;

        await connection.manager.update(UserEntity, id, values);
    }

    public async setHasPaymentMethod(id: number, value: boolean): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { hasPaymentMethod: value });
    }

    public async setType(id: number, type: UserType): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { type });
    }

    public async getAllDisplayNames(): Promise<string[]> {
        const connection = await this.db.getConnection();

        const result = await connection.createQueryBuilder(UserEntity, 'user')
            .select('user.displayName', 'displayName')
            .where('user.displayName IS NOT NULL')
            .getRawMany();

        return result.map(r => r.displayName);
    }

    public async setMetadata(id: number, metadata: UserMetadata): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { metadata });
    }

    public async setFraudulent(id: number, fraudulent: boolean): Promise<void> {
        const connection = await this.db.getConnection();
        await connection.manager.update(UserEntity, id, { fraudulent });
    }
}
