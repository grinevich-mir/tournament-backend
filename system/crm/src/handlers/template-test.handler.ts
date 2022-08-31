import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import _ from 'lodash';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMMessageData, CRMSender, CRMTemplateName } from '@tcom/platform/lib/crm';
import { UserNotificationType } from '@tcom/platform/lib/user';

interface TestEvent {
    userId: number;
    template: CRMTemplateName;
    data: CRMMessageData;
}

@Singleton
@LogClass()
export class TemplateTestHandler {
    constructor(@Inject private readonly crmSender: CRMSender) {
    }

    public async execute(event: TestEvent): Promise<void> {
        await this.crmSender.send(event.userId, UserNotificationType.Account, event.template, {
            data: event.data
        });
    }
}

export const templateTest = lambdaHandler((event: TestEvent) => IocContainer.get(TemplateTestHandler).execute(event));