import { GlobalDB } from '../../core/db';
import { Inject, Singleton } from '../../core/ioc';
import { UserNotificationSettingEntity } from '../entities';
import { UserNotificationSettingEntityMapper } from '../entities/mappers';
import { UserNotificationChannel } from '../user-notification-channel';
import { UserNotificationSetting } from '../user-notification-setting';
import { UserNotificationSettingUpdate } from '../user-notification-setting-update';

@Singleton
export class UserNotificationSettingRepository {
    constructor(
        @Inject private readonly db: GlobalDB,
        @Inject private readonly mapper: UserNotificationSettingEntityMapper) {}

    public async getAll(userId: number): Promise<UserNotificationSetting[]> {
        const connection = await this.db.getConnection();
        const entities = await connection.manager.find(UserNotificationSettingEntity, {
            where: {
                userId
            },
            order: {
                channel: 'ASC'
            }
        });

        if (entities.length === 0)
            return [];

        return entities.map(e => this.mapper.fromEntity(e));
    }

    public async get(userId: number, channel: UserNotificationChannel): Promise<UserNotificationSetting | undefined> {
        const connection = await this.db.getConnection();
        const entity = await connection.manager.findOne(UserNotificationSettingEntity, {
            where: {
                userId,
                channel
            }
        });

        if (!entity)
            return undefined;

        return this.mapper.fromEntity(entity);
    }

    public async set(userId: number, channel: UserNotificationChannel, update: UserNotificationSettingUpdate): Promise<UserNotificationSetting> {
        const connection = await this.db.getConnection();
        const entity = this.mapper.updateToEntity(userId, channel, update);
        await connection.manager.save(entity, { reload: false });
        return await this.get(userId, channel) as UserNotificationSetting;
    }
}