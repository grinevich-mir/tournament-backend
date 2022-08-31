import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserProfileUpdatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler, DEFAULT_REGION } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { UserManager, UserType } from '@tcom/platform/lib/user';
import AWS from 'aws-sdk';
import { SkinManager } from '@tcom/platform/lib/skin';
import { AttributeListType } from 'aws-sdk/clients/cognitoidentityserviceprovider';

@Singleton
@LogClass()
class OnUserProfileUpdatedHandler extends PlatformEventHandler<UserProfileUpdatedEvent> {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly skinManager: SkinManager) {
            super();
    }

    protected async process(event: Readonly<UserProfileUpdatedEvent>): Promise<void> {
        const user = await this.userManager.get(event.userId);

        if (!user) {
            Logger.error(`User ${event.userId} not found.`);
            return;
        }

        if (user.type === UserType.Bot)
            return;

        const skin = await this.skinManager.get(user.skinId);

        if (!skin)
            return;

        const cognito = new AWS.CognitoIdentityServiceProvider({
            region: DEFAULT_REGION
        });

        if (!event.payload.mobileNumber)
            return;

        const attributes: AttributeListType = [{
            Name: 'phone_number',
            Value: event.payload.mobileNumber
        }];

        if (event.payload.mobileNumberVerified !== undefined)
            attributes.push(                {
                Name: 'phone_number_verified',
                Value: 'true' // event.payload.mobileNumberVerified === true ? 'true' : 'false' -- Eventually make users have to verify a change to mobile number
            });

        await cognito.adminUpdateUserAttributes({
            UserPoolId: skin.userPoolId,
            Username: user.secureId,
            UserAttributes: attributes
        }).promise();
    }
}

export const onUserProfileUpdated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserProfileUpdatedHandler).execute(event));