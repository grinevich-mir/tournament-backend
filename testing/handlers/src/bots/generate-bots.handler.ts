import { Inject, Singleton, IocContainer } from '@tcom/platform/lib/core/ioc';
import { UserRegistrationType, UserType, UserManager, NewUser } from '@tcom/platform/lib/user';
import * as faker from 'faker';
import _ from 'lodash';
import moment from 'moment';
import AWS from 'aws-sdk';
import { SkinManager, Skin } from '@tcom/platform/lib/skin';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { GlobalDB } from '@tcom/platform/lib/core/db';
import { UserEntity } from '@tcom/platform/lib/user/entities';

interface GenerateEvent {
    skin?: string;
    count?: number;
    cognito?: boolean;
}

@Singleton
class GenerateBotsHandler {
    private skinCache: { [skinId: string]: Skin } = {};

    constructor(
        @Inject private readonly manager: UserManager,
        @Inject private readonly skinManager: SkinManager,
        @Inject private readonly db: GlobalDB) {
    }

    public async generate(
        skinId: string = 'tournament',
        count: number = 10,
        cognito: boolean = false): Promise<string[]> {
        console.log(`Generating ${count} test user(s)...`);
        const maxDate = moment().add(-18, 'years');
        const minDate = maxDate.add(-80, 'years');
        const emails: string[] = [];

        let generatedCount = 0;
        let retryCount = 0;
        let botNumber = await this.getBotCount(skinId);

        while (generatedCount < count) {
            botNumber++;

            const country = faker.address.countryCode();
            const firstName = faker.name.firstName();
            const lastName = faker.name.lastName();
            const phoneNumber = `+15${_.random(100000000, 999999999)}`;
            const dob = faker.date.between(minDate.toDate(), maxDate.toDate());
            const username = faker.internet.userName(firstName, lastName);
            const email = `bot-${botNumber}@tournament.com`;

            const user: NewUser = {
                skinId,
                displayName: username,
                forename: firstName,
                surname: lastName,
                mobileNumber: phoneNumber,
                regType: UserRegistrationType.Password,
                country,
                dob,
                email,
                type: UserType.Bot,
                currencyCode: 'USD'
            };

            try {
                if (cognito)
                    user.secureId = await this.createCognitoUser(skinId, email);

                console.log('Creating user', JSON.stringify(user));

                await this.manager.add(user);
                emails.push(email);
            } catch (err) {
                console.warn('Failed to create bot user', err);

                if (retryCount >= 3)
                    throw err;

                if (cognito && user.secureId)
                    try {
                        await this.deleteCognitoUser(skinId, user.secureId);
                    } catch (err) {
                        console.error(`Could not delete cognito user ${user.secureId}`, err);
                    }

                botNumber--;
                retryCount++;
                continue;
            }

            generatedCount++;
            retryCount = 0;
        }
        console.log('Test user(s) generated.');
        return emails;
    }

    private async getBotCount(skinId: string): Promise<number> {
        const connection = await this.db.getConnection();

        return connection.manager.count(UserEntity, {
            where: {
                type: UserType.Bot,
                skinId
            }
        });
    }

    private async createCognitoUser(skinId: string, email: string): Promise<string> {
        const skin = await this.getSkin(skinId);
        const identityProvider = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });
        const result = await identityProvider.adminCreateUser({
            UserPoolId: skin.userPoolId,
            Username: email,
            ForceAliasCreation: false,
            MessageAction: 'SUPPRESS',
            DesiredDeliveryMediums: ['EMAIL'],
            UserAttributes: [
                {
                    Name: 'custom:on_platform',
                    Value: 'true'
                }
            ]
        }).promise();

        await identityProvider.adminSetUserPassword({
            UserPoolId: skin.userPoolId,
            Username: email,
            Password: 'Abc12345',
            Permanent: true
        }).promise();

        if (!result.User || !result.User.Username)
            throw new Error('Something went wrong creating Cognito user.');

        return result.User.Username;
    }

    private async deleteCognitoUser(skinId: string, id: string): Promise<void> {
        const skin = await this.getSkin(skinId);
        const identityProvider = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });
        await identityProvider.adminDeleteUser({
            UserPoolId: skin.userPoolId,
            Username: id
        }
        ).promise();
    }

    private async getSkin(skinId: string): Promise<Skin> {
        if (this.skinCache[skinId])
            return this.skinCache[skinId];

        const skin = await this.skinManager.get(skinId);

        if (!skin)
            throw new Error(`Skin '${skinId}' not found.`);

        return skin;
    }
}

export const generateBots = lambdaHandler((event: GenerateEvent) => IocContainer.get(GenerateBotsHandler).generate(event.skin, event.count, event.cognito));
