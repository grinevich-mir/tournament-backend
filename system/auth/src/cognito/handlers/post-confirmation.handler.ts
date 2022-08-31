import { Singleton, IocContainer } from '@tcom/platform/lib/core/ioc';
import { CognitoUserPoolTriggerEvent } from 'aws-lambda';
import { lambdaHandler, DEFAULT_REGION } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import AWS from 'aws-sdk';

@Singleton
@LogClass()
export class PostConfirmationHandler {
    public async execute(event: CognitoUserPoolTriggerEvent): Promise<CognitoUserPoolTriggerEvent> {
        Logger.debug(`Trigger Event`, event);

        if (event.request.userAttributes.email_verified === 'true')
            return event;

        const cognito = new AWS.CognitoIdentityServiceProvider({
            region: DEFAULT_REGION
        });

        await cognito.adminUpdateUserAttributes({
            UserPoolId: event.userPoolId,
            Username: event.userName as string,
            UserAttributes: [
                {
                    Name: 'email_verified',
                    Value: 'true'
                }
            ]
        }).promise();

        return event;
    }
}

export const postConfirmation = lambdaHandler((event: CognitoUserPoolTriggerEvent) => IocContainer.get(PostConfirmationHandler).execute(event));