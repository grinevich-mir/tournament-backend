import { IocContainer, Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler, DEFAULT_REGION } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import AWS from 'aws-sdk';
import { SkinManager } from '@tcom/platform/lib/skin';
import { UserType } from 'aws-sdk/clients/cognitoidentityserviceprovider';

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

        const unverfied = users.filter(u => u.Attributes?.find(a => a.Name === 'email_verified' && a.Value === 'false'));

        const count = await this.fixUsers(userPoolId, unverfied as Required<UserType>[]);
        Logger.info(`Fixed ${count} confirmed user(s) email verified flag from user pool ${userPoolId}`);
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
                Filter: 'cognito:user_status = "CONFIRMED"',
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

    private async fixUsers(userPoolId: string, users: Required<UserType>[]): Promise<number> {
        let fixed = 0;
        const cognito = new AWS.CognitoIdentityServiceProvider({
            region: DEFAULT_REGION
        });

        for (const user of users)
            try {
                await cognito.adminUpdateUserAttributes({
                    UserPoolId: userPoolId,
                    Username: user.Username as string,
                    UserAttributes: [
                        {
                            Name: 'email_verified',
                            Value: 'true'
                        }
                    ]
                }).promise();
                fixed++;
            } catch (err) {
                Logger.error(`Could not fix user ${user.Username}`, err);
            }

        return fixed;
    }
}

export const fixConfirmedUsersEmailVerified = lambdaHandler(() => IocContainer.get(CleanupUnconfirmedUsersHandler).execute());