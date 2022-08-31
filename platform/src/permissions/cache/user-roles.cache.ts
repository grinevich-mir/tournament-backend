import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { Role } from '../role';
import { UserRoles } from '../user-roles';

interface UserRolesCacheItem {
    userId: string;
    roles: string;
}

@Singleton
export class UserRolesCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('USER_ROLES');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async getAll(): Promise<UserRoles[] | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItems = await this.redis.cluster.hvals(cacheKey) as string[];

        if (!rawItems || rawItems.length === 0)
            return undefined;

        return rawItems.map(a => this.toUserRoles(a));
    }

    public async get(userId: string): Promise<UserRoles | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItem = await this.redis.cluster.hget(cacheKey, userId);

        if (!rawItem)
            return undefined;

        return this.toUserRoles(rawItem);
    }

    public async store(item: UserRoles): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const cacheItem: UserRolesCacheItem = { userId: item.userId, roles: item.roles.join('|') };
        await this.redis.cluster.hset(cacheKey, item.userId, this.serialiser.serialise(cacheItem));
    }

    public async remove(item: UserRoles): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.hdel(cacheKey, item.userId);
    }

    private toUserRoles(rawItem: string): UserRoles {
        const cacheItem = this.serialiser.deserialise<UserRolesCacheItem>(rawItem);
        const roles = cacheItem.roles.split('|').map(r => Role[r as keyof typeof Role]);

        return {
            userId: cacheItem.userId,
            roles
        };
    }
}