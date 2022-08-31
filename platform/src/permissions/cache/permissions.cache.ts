import { JsonSerialiser, Redis } from '../../core';
import { CacheKeyGenerator } from '../../core/cache';
import { Inject, Singleton } from '../../core/ioc';
import { Role } from '../role';
import { RolePermissions } from '../role-permissions';

@Singleton
export class PermissionsCache {
    private readonly cacheKeyGenerator = new CacheKeyGenerator('PERMISSIONS');

    constructor(
        @Inject private readonly redis: Redis,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async getAll(): Promise<RolePermissions[] | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItems = await this.redis.cluster.hvals(cacheKey) as string[];

        if (!rawItems || rawItems.length === 0)
            return undefined;

        return rawItems.map(r => this.serialiser.deserialise<RolePermissions>(r));
    }

    public async get(role: Role): Promise<RolePermissions | undefined> {
        const cacheKey = this.cacheKeyGenerator.generate();
        const rawItem = await this.redis.cluster.hget(cacheKey, role) as string;

        if (!rawItem)
            return undefined;

        return this.serialiser.deserialise<RolePermissions>(rawItem);
    }

    public async store(...items: RolePermissions[]): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();

        for (const item of items)
            await this.redis.cluster.hset(cacheKey, item.role, this.serialiser.serialise(item));
    }

    public async remove(role: Role): Promise<void> {
        const cacheKey = this.cacheKeyGenerator.generate();
        await this.redis.cluster.hdel(cacheKey, role);
    }
}