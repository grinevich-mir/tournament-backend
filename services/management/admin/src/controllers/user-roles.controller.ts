import { AdminController, Route, Tags, Security, Get, Post, Body, Delete, Put, Path } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError } from '@tcom/platform/lib/core';
import { Role, UserRoles, UserRolesManager } from '@tcom/platform/lib/permissions';

@Tags('User Roles')
@Route('admin/permissions/user')
@LogClass()
export class UserRolesController extends AdminController {
    constructor(
        @Inject private readonly manager: UserRolesManager) {
        super();
    }

    /**
     * @summary Gets all user roles
     */
    @Get('roles')
    @Security('admin', ['admin:permissions:read'])
    public async getAll(): Promise<UserRoles[]> {
        return this.manager.getAll();
    }

    /**
     * @summary Gets user roles by id
     * @IsString id
     * @param id Cognito User ID
     */
    @Get('{id}/roles')
    @Security('admin', ['admin:permissions:read'])
    public async get(@Path() id: string): Promise<UserRoles> {
        const userRoles = await this.manager.get(id);

        if (!userRoles)
            throw new NotFoundError('UserRoles not found.');

        return userRoles;
    }

    /**
     * @summary Adds new user roles
     */
    @Post('roles')
    @Security('admin', ['admin:permissions:write'])
    public async add(@Body() userRoles: UserRoles): Promise<void> {
        await this.manager.add(userRoles);
    }

    /**
     * @summary Updates user roles
     * @IsString id
     * @param id Cognito User ID
     */
    @Put('{id}/roles')
    @Security('admin', ['admin:permissions:write'])
    public async update(@Path() id: string, @Body() roles: Role[]): Promise<UserRoles> {
        return this.manager.update(id, roles);
    }

    /**
     * @summary Removes user roles
     * @IsString id
     * @param id Cognito User ID
     */
    @Delete('{id}/roles')
    @Security('admin', ['admin:permissions:delete'])
    public async remove(@Path() id: string): Promise<void> {
        await this.manager.remove(id);
    }
}
