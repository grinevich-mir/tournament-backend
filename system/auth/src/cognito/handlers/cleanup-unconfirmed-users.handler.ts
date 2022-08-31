import { IocContainer, Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler, DEFAULT_REGION } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import AWS from 'aws-sdk';
import { SkinManager } from '@tcom/platform/lib/skin';
import { UserType } from 'aws-sdk/clients/cognitoidentityserviceprovider';
import moment from 'moment';

const MAX_DAYS = 1;

@Singleton
@LogClass()
class CleanupUnconfirmedUsersHandler {
    constructor(@Inject private readonly skinManager: SkinManager) {
    }

    public async execute(): Promise<void> {
        const skins = await this.skinManager.getAll();
        await Promise.all(skins.map(skin => this.processUserPool(skin.userPoolId)));
    }

    private async processUserPool(userPoolId: string): Promise<void> {
        const users = await this.collectUsers(userPoolId);

        const nonPlatformUsers = users.filter(user => {
            const platformAttr = user.Attributes?.find(a => a.Name === 'custom:on_platform');

            if (!platformAttr)
                return true;

            return false;
        });

        const expiredUsers = nonPlatformUsers.filter(user => moment(user.UserCreateDate).add(MAX_DAYS, 'days').isSameOrBefore());
        const count = await this.deleteUsers(userPoolId, expiredUsers as Required<UserType>[]);
        Logger.info(`Deleted ${count} expired unconfirmed user(s) from user pool ${userPoolId}`);
    }

    private async collectUsers(userPoolId: string): Promise<UserType[]> {
        let paginationToken: string | undefined;
        const users: UserType[] = [];

        while (true) {
            const cognito = new AWS.CognitoIdentityServiceProvider({
                region: DEFAULT_REGION
            });

            const response = await cognito.listUsers({
                UserPoolId: userPoolId,
                Filter: 'cognito:user_status = "UNCONFIRMED"',
                Limit: 60,
                PaginationToken: paginationToken
            }).promise();

            if (response.Users && response.Users.length > 0)
                users.push(...response.Users);

            if (!response.PaginationToken)
                break;

            paginationToken = response.PaginationToken;
        }

        return users;
    }

    private async deleteUsers(userPoolId: string, users: Required<UserType>[]): Promise<number> {
        let deleted = 0;
        const cognito = new AWS.CognitoIdentityServiceProvider({
            region: DEFAULT_REGION
        });

        for (const user of users)
            try {
                await cognito.adminDeleteUser({
                    UserPoolId: userPoolId,
                    Username: user.Username
                }).promise();
                deleted++;
            } catch (err) {
                Logger.error(`Could not delete user ${user.Username}`, err);
            }

        return deleted;
    }
}

export const cleanupUnconfirmedUsers = lambdaHandler(() => IocContainer.get(CleanupUnconfirmedUsersHandler).execute());