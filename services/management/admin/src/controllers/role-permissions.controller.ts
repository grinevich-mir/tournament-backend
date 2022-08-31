import { AdminController, Route, Tags, Security, Get, Post, Body, Delete, Put, Path } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError } from '@tcom/platform/lib/core';
import { RolePermissionsManager, Role, RolePermissions } from '@tcom/platform/lib/permissions';
import { UpdatePermissionsModel } from '../models';

@Tags('Role Permissions')
@Route('admin/permissions/role')
@LogClass()
export class RolePermissionsController extends AdminController {
    constructor(
        @Inject private readonly manager: RolePermissionsManager) {
        super();
    }

    /**
     * @summary Gets all permissions
     */
    @Get()
    @Security('admin', ['admin:permissions:read'])
    public async getAll(): Promise<RolePermissions[]> {
        return this.manager.getAll();
    }

    /**
     * @summary Gets permissions by role
     */
    @Get('{role}')
    @Security('admin', ['admin:permissions:read'])
    public async get(@Path() role: Role): Promise<RolePermissions> {
        const permissions = await this.manager.getByRole(role);

        if (!permissions)
            throw new NotFoundError('Permissions not found.');

        return permissions;
    }

    /**
     * @summary Adds new role permissions
     */
    @Post()
    @Security('admin', ['admin:permissions:write'])
    public async add(@Body() permissions: RolePermissions): Promise<void> {
        await this.manager.add(permissions);
    }

    /**
     * @summary Updates role permissions
     */
    @Put('{role}')
    @Security('admin', ['admin:permissions:write'])
    public async update(@Path() role: Role, @Body() update: UpdatePermissionsModel): Promise<RolePermissions> {
        return this.manager.update(role, update.fullAccess, update.scopes);
    }

    /**
     * @summary Removes role permissions
     */
    @Delete('{role}')
    @Security('admin', ['admin:permissions:delete'])
    public async remove(@Path() role: Role): Promise<void> {
        await this.manager.remove(role);
    }
}
