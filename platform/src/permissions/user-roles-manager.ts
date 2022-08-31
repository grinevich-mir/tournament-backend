import { Singleton, Inject } from '../core/ioc';
import { LogClass } from '../core/logging';
import { UserRolesCache } from './cache';
import { Role } from './role';
import { UserRoles } from './user-roles';

@Singleton
@LogClass()
export class UserRolesManager {
    constructor(
        @Inject private readonly cache: UserRolesCache) {
    }

    public async get(userId: string): Promise<UserRoles | undefined> {
        return this.cache.get(userId);
    }

    public async getAll(): Promise<UserRoles[]> {
        const cachedItems = await this.cache.getAll();

        if (!cachedItems || cachedItems.length === 0)
            return [];

        return cachedItems;
    }

    public async add(item: UserRoles): Promise<void> {
        const userRoles = await this.getAll();

        if (userRoles?.some(a => a.userId === item.userId))
            throw new Error(`UserRole for '${item.userId}' already exists.`);

        await this.cache.store(item);
    }

    public async update(userId: string, roles: Role[]): Promise<UserRoles> {
        const userRole = await this.get(userId);

        if (!userRole)
            throw new Error(`UserRole for '${userId}' does not exist.`);

        userRole.roles = roles;

        await this.cache.store(userRole);

        return userRole;
    }

    public async remove(userId: string): Promise<void> {
        const userRole = await this.get(userId);

        if (!userRole)
            throw new Error(`UserRole for '${userId}' does not exist.`);

        await this.cache.remove(userRole);
    }
}