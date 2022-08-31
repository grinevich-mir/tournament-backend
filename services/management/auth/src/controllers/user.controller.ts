import { AdminController, Get, Route, Tags, Security, Path, Put, Delete, Body, Post } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { DEFAULT_REGION, NotFoundError } from '@tcom/platform/lib/core';
import { SkinManager } from '@tcom/platform/lib/skin';
import { UserModel, UsersModel, UsersFilter } from '../models';
import { UserModelMapper } from '../models/mappers';
import AWS from 'aws-sdk';
import * as env from 'env-var';

@Tags('Users')
@Route('auth/user')
@Security('admin')
@LogClass()
export class UserController extends AdminController {
    constructor(
        @Inject private readonly skinManager: SkinManager,
        @Inject private readonly userMapper: UserModelMapper) {
        super();
    }

    /**
     * @summary Gets all users
     */
    @Post()
    @Security('admin', ['auth:user:read'])
    public async getAll(@Body() filter: UsersFilter): Promise<UsersModel> {
        const brand = env.get('BRAND').required().asString();
        const skin = await this.skinManager.get(brand);

        if (!skin)
            throw new NotFoundError(`Skin configuration not found for ${brand}.`);

        let paginationToken = filter.paginationToken;
        const users: UserModel[] = [];

        while (true) {
            const cognito = new AWS.CognitoIdentityServiceProvider({
                region: DEFAULT_REGION
            });

            const response = await cognito.listUsers({
                UserPoolId: skin.userPoolId,
                Filter: filter.query,
                Limit: 60,
                PaginationToken: paginationToken
            }).promise();

            if (response.Users && response.Users.length > 0) {
                const mapped = response.Users.map(u => this.userMapper.fromUserType(u));
                users.push(...mapped);
            }

            paginationToken = response.PaginationToken;

            if (filter.pagination)
                break;

            if (!paginationToken)
                break;
        }

        return {
            users,
            paginationToken
        };
    }

    /**
     * @summary Gets user by username
     */
    @Get('{username}')
    @Security('admin', ['auth:user:read'])
    public async get(@Path() username: string): Promise<UserModel> {
        const brand = env.get('BRAND').required().asString();
        const skin = await this.skinManager.get(brand);

        if (!skin)
            throw new NotFoundError(`Skin configuration not found for ${brand}.`);

        const cognito = new AWS.CognitoIdentityServiceProvider({ region: DEFAULT_REGION });

        const user = await cognito.adminGetUser({
            UserPoolId: skin.userPoolId,
            Username: username,
        }).promise();

        if (!user)
            throw new NotFoundError(`User '${username}' not found.`);

        return this.userMapper.fromUserType(user);
    }

    /**
     * @summary Confirms a pending signup
     */
    @Put('{username}/confirm')
    @Security('admin', ['auth:user:write'])
    public async confirm(@Path() username: string): Promise<void> {
        const brand = env.get('BRAND').required().asString();
        const skin = await this.skinManager.get(brand);

        if (!skin)
            throw new NotFoundError(`Skin configuration not found for ${brand}.`);

        const cognito = new AWS.CognitoIdentityServiceProvider({ region: DEFAULT_REGION });

        await cognito.adminConfirmSignUp({
            UserPoolId: skin.userPoolId,
            Username: username
        }).promise();
    }

    /**
     * @summary Deletes a user
     */
    @Delete('{username}')
    @Security('admin', ['auth:user:delete'])
    public async remove(@Path() username: string): Promise<void> {
        const brand = env.get('BRAND').required().asString();
        const skin = await this.skinManager.get(brand);

        if (!skin)
            throw new NotFoundError(`Skin configuration not found for ${brand}.`);

        const cognito = new AWS.CognitoIdentityServiceProvider({ region: DEFAULT_REGION });

        await cognito.adminDeleteUser({
            UserPoolId: skin.userPoolId,
            Username: username
        }).promise();
    }
}