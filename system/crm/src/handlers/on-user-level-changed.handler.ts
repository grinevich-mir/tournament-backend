import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserLevelChangedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMManager, ContactUpdate } from '@tcom/platform/lib/crm';
import { UserType, UserManager } from '@tcom/platform/lib/user';
import { CRMEventType } from '../crm-event-type';

@Singleton
@LogClass()
class OnUserLevelChangedHandler extends PlatformEventHandler<UserLevelChangedEvent> {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly crmManager: CRMManager) {
            super();
    }

    protected async process(event: Readonly<UserLevelChangedEvent>): Promise<void> {
        const user = await this.userManager.get(event.id);

        if (!user) {
            Logger.error(`User ${event.id} not found.`);
            return;
        }

        if (user.type === UserType.Bot)
            return;

        const update: ContactUpdate = {
            level: user.level
        };

        Logger.info('Updating contact', update);

        await this.crmManager.updateContact(event.id, update);
        await this.crmManager.addEvent(user.id, CRMEventType.UserLevelChanged, {
            from: event.from,
            to: event.to
        });
    }
}

export const onUserLevelChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserLevelChangedHandler).execute(event));