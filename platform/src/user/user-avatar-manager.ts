import { Singleton, Inject } from '../core/ioc';
import { UserAvatarRepository } from './repositories';
import { UserAvatar } from './user-avatar';
import { UserAvatarEntityMapper } from './entities/mappers';
import { UserAvatarCache } from './cache';
import _ from 'lodash';
import { LogClass } from '../core/logging';

@Singleton
@LogClass()
export class UserAvatarManager {
    constructor(
        @Inject private readonly repository: UserAvatarRepository,
        @Inject private readonly entityMapper: UserAvatarEntityMapper,
        @Inject private readonly cache: UserAvatarCache) {
        }

    public async getAll(skinId: string): Promise<UserAvatar[]> {
        const cached = await this.cache.getAll(skinId);

        if (cached.length > 0)
            return cached;

        const entities = await this.repository.getAll(skinId);
        const avatars = entities.map(e => this.entityMapper.fromEntity(e));
        await this.cache.store(...avatars);
        return avatars;
    }

    public async get(id: number): Promise<UserAvatar | undefined> {
        const cached = await this.cache.get(id);

        if (cached)
            return cached;

        const entity = await this.repository.get(id);

        if (!entity)
            return undefined;

        const avatar = this.entityMapper.fromEntity(entity);
        await this.cache.store(avatar);
        return avatar;
    }

    public async getRandom(skinId: string): Promise<UserAvatar | undefined> {
        const avatars = await this.getAll(skinId);
        return _.sample(avatars);
    }
}