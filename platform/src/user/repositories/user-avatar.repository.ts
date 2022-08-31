import { GlobalDB } from '../../core/db';
import { Singleton, Inject } from '../../core/ioc';
import { UserAvatarEntity } from '../entities/user-avatar.entity';
import { LogClass } from '../../core/logging';

@Singleton
@LogClass()
export class UserAvatarRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getAll(skinId: string): Promise<UserAvatarEntity[]> {
        const connection = await this.db.getConnection();
        return connection.manager.find(UserAvatarEntity, { where: { skinId } });
    }

    public async get(id: number): Promise<UserAvatarEntity | undefined> {
        const connection = await this.db.getConnection();
        return connection.manager.findOne(UserAvatarEntity, id);
    }
}