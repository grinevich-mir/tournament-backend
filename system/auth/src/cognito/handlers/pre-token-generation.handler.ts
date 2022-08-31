import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { CognitoUserPoolTriggerEvent } from 'aws-lambda';
import { DEFAULT_REGION, lambdaHandler, JsonSerialiser } from '@tcom/platform/lib/core';
import AWS from 'aws-sdk';
import { SkinManager } from '@tcom/platform/lib/skin';
import { UserType, UserRegistrationType, UserManager, NewUser, UserNotificationSettingManager, UserNotificationChannel } from '@tcom/platform/lib/user';
import { AvatarProcessor } from '@tcom/platform/lib/user/utilities';
import request from 'request-promise';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

interface CognitoIdentity {
    userId: string;
    providerName: string;
    providerType: string;
    issuer: string | null;
    primary: boolean;
    dateCreated: number;
}

interface FacebookPictureInfo {
    data: {
        height: number;
        is_silhouette: boolean;
        url: string;
    };
}

@Singleton
@LogClass()
export class PreTokenGenerationHandler {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly notificationSettings: UserNotificationSettingManager,
        @Inject private readonly skinManager: SkinManager,
        @Inject private readonly avatarProcessor: AvatarProcessor,
        @Inject private readonly serialiser: JsonSerialiser) {
    }

    public async execute(event: CognitoUserPoolTriggerEvent): Promise<CognitoUserPoolTriggerEvent> {
        Logger.debug(`Trigger Event`, event);

        if (event.request.userAttributes['custom:on_platform'] === 'true')
            return event;

        const skin = await this.skinManager.getByUserPoolId(event.userPoolId);

        if (!skin) {
            console.error(`Skin not found for user pool ${event.userPoolId}`);
            throw new Error('Skin not found.');
        }

        const userSecureId = event.request.userAttributes.sub;

        if (await this.userManager.exists(userSecureId)) {
            await this.setCognitoOnPlatformFlag(event);
            return event;
        }

        let bTag: string | undefined;

        if (event.request.userAttributes['custom:btag'])
            bTag = event.request.userAttributes['custom:btag'];

        let referredCode: string | undefined;

        if (event.request.userAttributes['custom:referredCode'])
            referredCode = event.request.userAttributes['custom:referredCode'];

        let marketingOptOut = false;

        if (event.request.userAttributes['custom:marketingOptIn'] === 'false')
            marketingOptOut = true;

        let clickId: string | undefined;
        if (event.request.userAttributes['custom:clickId'])
            clickId = event.request.userAttributes['custom:clickId'];

        const newUser: NewUser = {
            secureId: userSecureId,
            skinId: skin.id,
            currencyCode: 'USD', // TODO: REMOVE once we support multiple currencies.
            email: event.request.userAttributes.email,
            emailVerified: false, // event.request.userAttributes.email_verified === 'true',
            mobileNumber: event.request.userAttributes.phone_number,
            mobileVerified: event.request.userAttributes.phone_number_verified === 'true',
            type: UserType.Standard,
            regType: this.getRegistrationType(event),
            bTag,
            referredCode,
            clickId,
        };

        const avatarUrl = await this.extractAvatarUrl(event);

        if (avatarUrl)
            try {
                newUser.customAvatarId = await this.avatarProcessor.processUrl(avatarUrl, false);
            } catch (err) {
                console.warn('Could not save avatar:', err);
            }

        const user = await this.userManager.add(newUser);
        await this.setCognitoOnPlatformFlag(event);

        if (marketingOptOut)
            await this.notificationSettings.set(user.id, UserNotificationChannel.Email, {
                marketing: false
            });

        return event;
    }

    private async setCognitoOnPlatformFlag(event: CognitoUserPoolTriggerEvent): Promise<void> {
        const cognito = new AWS.CognitoIdentityServiceProvider({ region: DEFAULT_REGION });
        await cognito.adminUpdateUserAttributes({
            UserPoolId: event.userPoolId,
            Username: String(event.userName),
            UserAttributes: [
                {
                    Name: 'custom:on_platform',
                    Value: 'true'
                }
            ]
        }).promise();
    }

    private getRegistrationType(event: CognitoUserPoolTriggerEvent): UserRegistrationType {
        if (event.request.userAttributes['cognito:user_status'] === 'EXTERNAL_PROVIDER')
            return UserRegistrationType.Social;

        return UserRegistrationType.Password;
    }

    private async extractAvatarUrl(event: CognitoUserPoolTriggerEvent): Promise<string | undefined> {
        if (event.request.userAttributes['cognito:user_status'] !== 'EXTERNAL_PROVIDER')
            return undefined;

        if (!event.request.userAttributes.identities)
            return undefined;

        if (event.userName && event.userName.startsWith('Facebook_'))
            return this.getFacebookAvatarUrl(event.request.userAttributes.identities);

        // TODO: Extract other providers avatar URLs
        return undefined;
    }

    private async getFacebookAvatarUrl(identitiesJson: string): Promise<string | undefined> {
        Logger.info('Getting Facebook Avatar URL', identitiesJson);
        const identities = this.serialiser.deserialise<CognitoIdentity[]>(identitiesJson);
        const identity = identities.find(i => i.providerType === 'Facebook' && i.primary);

        if (!identity)
            return undefined;

        const graphUrl = `http://graph.facebook.com/${identity.userId}/picture?type=square&width=320&height=320&redirect=0`;

        const pictureData = await request({
            uri: graphUrl,
            json: true
        }) as FacebookPictureInfo;

        Logger.info(`Facebook profile picture data`, pictureData);

        if (pictureData.data.is_silhouette)
            return undefined;

        return pictureData.data.url;
    }
}

export const preTokenGeneration = lambdaHandler((event: CognitoUserPoolTriggerEvent) => IocContainer.get(PreTokenGenerationHandler).execute(event));