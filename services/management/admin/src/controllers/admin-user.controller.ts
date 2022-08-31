import { AdminController, Get, Route, Tags, Security, Path } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { DEFAULT_REGION, NotFoundError } from '@tcom/platform/lib/core';
import AWS from 'aws-sdk';
import * as env from 'env-var';
import { AdminUserModel } from '../models';
import { AdminUserModelMapper } from '../models/mappers';

@Tags('Admin Users')
@Route('admin/user')
@Security('admin')
@LogClass()
export class AdminUserController extends AdminController {
    constructor(@Inject private readonly mapper: AdminUserModelMapper) {
        super();
    }

    /**
     * @summary Get all admin users
     */
    @Get()
    public async getAll(): Promise<AdminUserModel[]> {
        const userPoolId = env.get('ADMIN_USER_POOL_ID').required().asString();

        const cognito = new AWS.CognitoIdentityServiceProvider({ region: DEFAULT_REGION });

        const response = await cognito.listUsers({
            UserPoolId: userPoolId
        }).promise();

        if (!response || !response.Users)
            throw new NotFoundError(`Admin users not found for UserPoolId ${userPoolId}.`);

        return response.Users?.map((a => this.mapper.fromAttributes(a.Attributes)));
    }

    /**
     * @summary Get admin user by id
     */
    @Get('{userId}')
    public async get(@Path() userId: string): Promise<AdminUserModel> {
        const userPoolId = env.get('ADMIN_USER_POOL_ID').required().asString();

        const cognito = new AWS.CognitoIdentityServiceProvider({ region: DEFAULT_REGION });

        const adminUser = await cognito.adminGetUser({
            UserPoolId: userPoolId,
            Username: userId,
        }).promise();

        return this.mapper.fromAttributes(adminUser.UserAttributes);
    }
}