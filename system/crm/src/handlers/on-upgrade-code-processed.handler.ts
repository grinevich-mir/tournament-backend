import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UpgradeCodeProcessedEvent } from '@tcom/platform/lib/upgrade/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import _ from 'lodash';
import { CRMSender, CRMTemplateName } from '@tcom/platform/lib/crm';
import { UserNotificationType } from '@tcom/platform/lib/user';

@Singleton
@LogClass()
class OnUpgadeCodeProcessedHandler extends PlatformEventHandler<UpgradeCodeProcessedEvent> {
    constructor(
        @Inject private readonly crmSender: CRMSender) {
            super();
    }

    protected async process(event: Readonly<UpgradeCodeProcessedEvent>): Promise<void> {
        await this.crmSender.send(event.code.userId, UserNotificationType.Account, CRMTemplateName.UpgradeCodeProcessed, {
            data: {
                upgradeCode: event.code.code
            }
        });
    }
}

export const onUpgradeCodeProcessed = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUpgadeCodeProcessedHandler).execute(event));