import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { CognitoUserPoolTriggerEvent } from 'aws-lambda';
import { lambdaHandler, UnauthorizedError, ParameterStore, Config, DEFAULT_REGION } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';
import AWS from 'aws-sdk';
import moment from 'moment';

@Singleton
@LogClass()
export class PreAuthenticationHandler {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async execute(event: CognitoUserPoolTriggerEvent): Promise<CognitoUserPoolTriggerEvent> {
        Logger.debug(`Trigger Event`, event);

        if (!event.userName)
            throw new UnauthorizedError('Unknown user');

        const cognito = new AWS.CognitoIdentityServiceProvider({
            region: DEFAULT_REGION
        });

        const user = await cognito.adminGetUser({
            UserPoolId: event.userPoolId,
            Username: event.userName
        }).promise();

        if (moment(user.UserCreateDate).isAfter(moment().subtract(30, 'minutes'))) {
            Logger.info('User was created within the last 30 minutes, skipping Captcha.');
            return event;
        }

        if (!event.request.validationData?.captchaToken)
            throw new UnauthorizedError('Captcha token missing.');

        const clientEmail = await this.parameterStore.get(`/${Config.stage}/integration/recaptcha/client-email`, false,  true);
        const privateKey = await this.parameterStore.get(`/${Config.stage}/integration/recaptcha/private-key`, true,  true);

        const recaptchaClient = new RecaptchaEnterpriseServiceClient({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey
            }
        });
        const projectNumber = await this.parameterStore.get(`/${Config.stage}/integration/recaptcha/project-number`, false,  true);
        const siteKey = await this.parameterStore.get(`/${Config.stage}/integration/recaptcha/site-key`, false,  true);

        const formattedParent = recaptchaClient.projectPath(projectNumber);

        const [result] = await recaptchaClient.createAssessment({
            parent: formattedParent,
            assessment: {
                event: {
                    token: event.request.validationData.captchaToken,
                    siteKey
                }
            },
        });

        if (!result.tokenProperties?.valid)
            throw new UnauthorizedError('Invalid Captcha token.');

        return event;
    }
}

export const preAuthentication = lambdaHandler((event: CognitoUserPoolTriggerEvent) => IocContainer.get(PreAuthenticationHandler).execute(event));