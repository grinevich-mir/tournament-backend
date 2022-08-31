import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserProfileUpdatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMManager, ContactUpdate } from '@tcom/platform/lib/crm';
import { UserManager, UserType } from '@tcom/platform/lib/user';
import { CRMEventType } from '../crm-event-type';

@Singleton
@LogClass()
class OnUserProfileUpdatedHandler extends PlatformEventHandler<UserProfileUpdatedEvent> {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly crmManager: CRMManager) {
            super();
    }

    protected async process(event: Readonly<UserProfileUpdatedEvent>): Promise<void> {
        const user = await this.userManager.get(event.userId);

        if (!user) {
            Logger.error(`User ${event.userId} not found.`);
            return;
        }

        if (user.type === UserType.Bot)
            return;

        const update: ContactUpdate = {
            forename: event.payload.forename,
            surname: event.payload.surname,
            dob: event.payload.dob,
            sms: event.payload.mobileNumber
        };

        if (Object.values(update).every(p => p === undefined)) {
            Logger.info('Nothing to update.');
            return;
        }

        Logger.info('Updating contact', update);

        await this.crmManager.updateContact(event.userId, update);
        await this.crmManager.addEvent(event.userId, CRMEventType.UserProfileUpdated);
    }
}

export const onUserProfileUpdated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserProfileUpdatedHandler).execute(event));