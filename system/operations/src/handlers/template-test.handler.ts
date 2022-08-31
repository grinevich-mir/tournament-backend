import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import _ from 'lodash';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { EmailSender } from '../email-sender';
import { EmailGroup } from '../email-group';

interface TestEvent {
    recipients?: string[];
    template: string;
    data: EmailSender;
    send: boolean;
}

@Singleton
@LogClass()
export class TemplateTestHandler {
    constructor(@Inject private readonly emailSender: EmailSender) {
    }

    public async execute(event: TestEvent): Promise<void> {
        await this.emailSender.test(event.template, event.data);

        if (!event.send)
            return;

        if (event.recipients && event.recipients.length > 0)
            await this.emailSender.sendTo(event.recipients, event.template, event.data);
        else
            await this.emailSender.send(event.template, event.data, EmailGroup.Admin);
    }
}

export const templateTest = lambdaHandler((event: TestEvent) => IocContainer.get(TemplateTestHandler).execute(event));