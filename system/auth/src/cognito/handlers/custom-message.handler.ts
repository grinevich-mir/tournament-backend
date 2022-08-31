import { Singleton, Inject, IocContainer } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMManager, CRMTemplateName } from '@tcom/platform/lib/crm';
import { CognitoUserPoolTriggerEvent } from 'aws-lambda';
import { lambdaHandler, NotFoundError } from '@tcom/platform/lib/core';
import Handlebars from 'handlebars';
import { SkinManager } from '@tcom/platform/lib/skin';

@Singleton
@LogClass()
export class CustomMessageHandler {
    constructor(
        @Inject private readonly crmManager: CRMManager,
        @Inject private readonly skinManager: SkinManager) {
        }

    public async execute(event: CognitoUserPoolTriggerEvent): Promise<CognitoUserPoolTriggerEvent> {
        Logger.debug(`Trigger Event`, event);

        switch(event.triggerSource) {
            case 'CustomMessage_SignUp':
            case 'CustomMessage_ResendCode':
                return this.processSms(event, CRMTemplateName.ConfirmationCode, {
                    Email: encodeURIComponent(event.request.userAttributes.email),
                    Phone: encodeURIComponent(event.request.userAttributes.phone_number),
                    Code: event.request.codeParameter
                });

            case 'CustomMessage_ForgotPassword':
                return this.processEmail(event, CRMTemplateName.ForgottenPassword, {
                    Email: encodeURIComponent(event.request.userAttributes.email),
                    Phone: encodeURIComponent(event.request.userAttributes.phone_number),
                    Code: event.request.codeParameter
                });
        }

        return event;
    }

    private async processSms(event: CognitoUserPoolTriggerEvent, templateName: CRMTemplateName, data?: { [key: string]: any }): Promise<CognitoUserPoolTriggerEvent> {
        const skin = await this.skinManager.getByUserPoolId(event.userPoolId);

        if (!skin)
            throw new NotFoundError(`Could not find skin associated with user pool '${event.userPoolId}'.`);

        const template = await this.crmManager.getSmsTemplate(skin.id, templateName);
        const body = template.body;

        if (!body)
            return event;

        if (body.length > 20000) {
            Logger.error(`Body for template '${templateName}' for skin ${skin.id} is more than 20,000 characters, default template will be used.`);
            return event;
        }

        event.response.smsMessage = this.formatTemplate(body, data);
        return event;
    }

    private async processEmail(event: CognitoUserPoolTriggerEvent, templateName: CRMTemplateName, data?: { [key: string]: any }): Promise<CognitoUserPoolTriggerEvent> {
        const skin = await this.skinManager.getByUserPoolId(event.userPoolId);

        if (!skin)
            throw new NotFoundError(`Could not find skin associated with user pool '${event.userPoolId}'.`);

        const template = await this.crmManager.getEmailTemplate(skin.id, templateName);
        const body = template.html || template.text;

        if (!body)
            return event;

        if (body.length > 20000) {
            Logger.error(`Body for template '${templateName}' for skin ${skin.id} is more than 20,000 characters, default template will be used.`);
            return event;
        }

        if (template.subject)
            event.response.emailSubject = this.formatTemplate(template.subject, data);

        event.response.emailMessage = this.formatTemplate(body, data);

        return event;
    }

    private formatTemplate(body: string, data?: { [key: string]: any }): string {
        const template = Handlebars.compile(body);
        return template(data);
    }
}

export const customMessage = lambdaHandler((event: CognitoUserPoolTriggerEvent) => IocContainer.get(CustomMessageHandler).execute(event));