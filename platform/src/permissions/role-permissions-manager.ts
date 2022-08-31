import { Singleton, Inject } from '../core/ioc';
import { LogClass } from '../core/logging';
import { PermissionsCache } from './cache';
import { Role } from './role';
import { RolePermissions } from './role-permissions';
import _ from 'lodash';

@Singleton
@LogClass()
export class RolePermissionsManager {
    constructor(
        @Inject private readonly permissionsCache: PermissionsCache) {
    }

    public async getAll(): Promise<RolePermissions[]> {
        const cachedItems = await this.permissionsCache.getAll();

        if (!cachedItems || cachedItems.length === 0)
            return [];

        return cachedItems;
    }

    public async getByRole(role: Role): Promise<RolePermissions | undefined> {
        return this.permissionsCache.get(role);
    }

    public async getAllByRoles(...roles: Role[]): Promise<RolePermissions[]> {
        const cachedItems = await this.permissionsCache.getAll();

        if (!cachedItems || cachedItems.length === 0)
            return [];

        return cachedItems.filter(a => roles.includes(a.role));
    }

    public async add(permission: RolePermissions): Promise<void> {
        const permissions = await this.getAll();

        if (permissions?.some(p => p.role === permission.role))
            throw new Error(`Permissions for role '${permission.role}' already exists.`);

        await this.permissionsCache.store(permission);
    }

    public async update(role: Role, fullAccess: boolean, scopes: string[]): Promise<RolePermissions> {
        const permission = await this.permissionsCache.get(role);

        if (!permission)
            throw new Error(`Permissions for role '${role}' do not exist.`);

        permission.fullAccess = fullAccess;
        permission.scopes = scopes;

        await this.permissionsCache.store(permission);

        return permission;
    }

    public async remove(role: Role): Promise<void> {
        const permission = await this.permissionsCache.get(role);

        if (!permission)
            throw new Error(`Permissions for role '${role}' do not exist.`);

        await this.permissionsCache.remove(role);
    }
}