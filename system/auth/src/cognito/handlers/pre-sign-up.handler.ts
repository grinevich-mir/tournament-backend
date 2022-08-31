import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler, BadRequestError, DEFAULT_REGION } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { PhoneWhitelistManager } from '@tcom/platform/lib/auth';
import { CognitoUserPoolTriggerEvent } from 'aws-lambda';
import AWS from 'aws-sdk';
import parsePhoneNumber from 'libphonenumber-js/max';

@Singleton
@LogClass()
export class PreSignUpHandler {
    constructor(@Inject private readonly phoneWhitelistManager: PhoneWhitelistManager) {
    }

    public async execute(event: CognitoUserPoolTriggerEvent): Promise<CognitoUserPoolTriggerEvent> {
        Logger.debug(`Trigger Event`, event);

        if (event.triggerSource !== 'PreSignUp_SignUp')
            return event;

        await this.validatePhoneNumber(event);

        return event;
    }

    private async validatePhoneNumber(event: CognitoUserPoolTriggerEvent): Promise<void> {
        const cognito = new AWS.CognitoIdentityServiceProvider({
            region: DEFAULT_REGION
        });

        const response = await cognito.describeUserPool({
            UserPoolId: event.userPoolId
        }).promise();

        if (!response.UserPool?.AutoVerifiedAttributes?.includes('phone_number')) {
            event.response.autoVerifyEmail = true;
            event.response.autoConfirmUser = true;
            return;
        }

        if (!event.request.userAttributes.phone_number)
            throw new BadRequestError('Phone number is required.');

        const phoneNumber = parsePhoneNumber(event.request.userAttributes.phone_number);

        if (!phoneNumber || !phoneNumber.isValid())
            throw new BadRequestError('Phone number is invalid.');

        const formattedPhoneNumber = phoneNumber.number.toString();

        if (event.request.userAttributes.phone_number !== formattedPhoneNumber)
            throw new BadRequestError('Phone number must be in e164 format.');

        if (!await this.phoneWhitelistManager.exists(formattedPhoneNumber) && await this.phoneNumberExists(event.userPoolId, formattedPhoneNumber))
            throw new BadRequestError('Phone number is already in use.');
    }

    private async phoneNumberExists(userPoolId: string, phoneNumber: string): Promise<boolean> {
        const cognito = new AWS.CognitoIdentityServiceProvider({
            region: DEFAULT_REGION
        });

        const response = await cognito.listUsers({
            UserPoolId: userPoolId,
            Filter: `phone_number = "${phoneNumber}"`,
            Limit: 1
        }).promise();

        if (response.Users && response.Users.length > 0)
            return true;

        return false;
    }
}

export const preSignUp = lambdaHandler((event: CognitoUserPoolTriggerEvent) => IocContainer.get(PreSignUpHandler).execute(event));