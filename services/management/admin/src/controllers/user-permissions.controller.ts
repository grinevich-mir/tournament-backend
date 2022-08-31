import { AdminController, Route, Tags, Security, Get, Path } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { NotFoundError } from '@tcom/platform/lib/core';
import { UserPermissionsManager, UserPermissions } from '@tcom/platform/lib/permissions';

@Tags('User Permissions')
@Route('admin/permissions/user')
@Security('admin')
@LogClass()
export class UserPermissionsController extends AdminController {
    constructor(
        @Inject private readonly manager: UserPermissionsManager) {
        super();
    }

    /**
     * @summary Gets user permissions by ID
     * @IsString id
     * @param id Cognito User ID
     */
    @Get('{id}')
    public async get(@Path() id: string): Promise<UserPermissions> {
        const permissions = await this.manager.get(id);

        if (!permissions)
            throw new NotFoundError(`Permissions not found for user ID ${id}`);

        return permissions;
    }
}
