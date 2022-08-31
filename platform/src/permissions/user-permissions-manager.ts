import { Singleton, Inject } from '../core/ioc';
import Logger, { LogClass } from '../core/logging';
import { UserRolesManager } from './user-roles-manager';
import { RolePermissionsManager } from './role-permissions-manager';
import { UserPermissions } from './user-permissions';
import _ from 'lodash';

@Singleton
@LogClass()
export class UserPermissionsManager {
    constructor(
        @Inject private readonly rolePermissionsManager: RolePermissionsManager,
        @Inject private readonly userRolesManager: UserRolesManager) {
    }

    public async get(userId: string): Promise<UserPermissions | undefined> {
        const userRoles = await this.userRolesManager.get(userId);

        if (!userRoles)
            return undefined;

        const rolePermissions = await this.rolePermissionsManager.getAllByRoles(...userRoles.roles);

        if (!rolePermissions)
            return undefined;

        return {
            roles: rolePermissions.map(a => a.role),
            scopes: _.uniq(_.flatten(rolePermissions.map(a => a.scopes))),
            fullAccess: rolePermissions.some(a => a.fullAccess)
        };
    }

    public async hasAccess(userId: string, ...scopes: string[]): Promise<boolean> {
        Logger.info(`Checking permissions for user '${userId}' with scope(s) '${scopes.join(', ')}'`);

        const userPermissions = await this.get(userId);

        if (!userPermissions)
            return false;

        if (userPermissions.fullAccess)
            return true;

        return userPermissions.scopes.some(s => scopes.includes(s));
    }
}