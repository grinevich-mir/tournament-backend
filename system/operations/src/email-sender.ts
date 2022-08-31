import { Config, DEFAULT_REGION, ParameterStore } from '@tcom/platform/lib/core';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import AWS from 'aws-sdk';
import { EmailGroup } from './email-group';

@Singleton
@LogClass()
export class EmailSender {
    constructor(
        @Inject private readonly parameterStore: ParameterStore) {
        }

    public async test(template: string, data: any): Promise<void> {
        const ses = new AWS.SES({
            region: DEFAULT_REGION
        });

        const templateData = JSON.stringify(data);

        await ses.testRenderTemplate({
            TemplateName: template,
            TemplateData: templateData
        }).promise();
    }

    public async send(template: string, data: any, group: EmailGroup): Promise<void> {
        const recipientsKey = `/${Config.stage}/operations/${group}/recipients`;
        const recipients = await this.parameterStore.getList(recipientsKey);
        await this.sendTo(recipients, template, data);
    }

    public async sendTo(recipients: string[], template: string, data: any): Promise<void> {
        const ses = new AWS.SES({
            region: DEFAULT_REGION
        });

        data = {
            ...data,
            env: {
                stage: Config.stage.toUpperCase()
            }
        };

        const templateData = JSON.stringify(data);

        let sender = 'Tournament Platform';

        if (Config.stage !== 'prod')
            sender += ` (${Config.stage.toUpperCase()})`;

        await ses.sendTemplatedEmail({
            Source: `${sender} <no-reply@tournament.com>`,
            Template: template,
            Destination: {
                ToAddresses: recipients
            },
            TemplateData: templateData
        }).promise();
    }
}