import { Singleton, Inject } from '../../core/ioc';
import { GlobalDB } from '../../core/db';
import { LogClass } from '../../core/logging';
import { UserProfileEntity, UserAddressEntity } from '../entities';

@Singleton
@LogClass({ arguments: false, result: false })
export class UserProfileRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async get(userId: number): Promise<UserProfileEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(UserProfileEntity, userId, {
            relations: ['address']
        });
    }

    public async getByEmail(email: string): Promise<UserProfileEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(UserProfileEntity, { email }, {
            relations: ['address']
        });
    }

    public async add(profile: UserProfileEntity): Promise<UserProfileEntity> {
        const connection = await this.db.getConnection();
        await connection.manager.insert(UserProfileEntity, profile);

        if (profile.address)
            await connection.manager.insert(UserAddressEntity, profile.address);

        return profile;
    }

    public async update(update: UserProfileEntity): Promise<void> {
        const connection = await this.db.getConnection();
        const updateEntity = connection.manager.create(UserProfileEntity, update);
        delete updateEntity.address;
        await connection.manager.update(UserProfileEntity, update.userId, updateEntity);

        if (update.address) {
            const exists = await connection.manager.count(UserAddressEntity, {
                where: {
                    profileUserId: update.userId
                }
            }) > 0;

            if (exists)
                await connection.manager.update(UserAddressEntity, update.userId, update.address);
            else
                await connection.manager.insert(UserAddressEntity, update.address);
        }
    }
}
