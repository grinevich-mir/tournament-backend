import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserCreatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { NewContact, CRMManager } from '@tcom/platform/lib/crm';
import { UserType } from '@tcom/platform/lib/user';
import { CRMEventType } from '../crm-event-type';

@Singleton
@LogClass()
class OnUserCreatedHandler extends PlatformEventHandler<UserCreatedEvent> {
    constructor(
        @Inject private readonly crmManager: CRMManager) {
            super();
    }

    protected async process(event: Readonly<UserCreatedEvent>): Promise<void> {
        const user = event.user;

        if (user.type === UserType.Bot)
            return;

        const profile = event.profile;

        if (!profile.email) {
            Logger.error(`User ${user.id} profile does not have an email address, CRM contact was not created.`);
            return;
        }

        const contact: NewContact = {
            userId: user.id,
            email: profile.email,
            emailVerified: profile.emailVerified,
            dob: profile.dob,
            sms: profile.mobileNumber,
            smsVerified: profile.mobileVerified,
            forename: profile.forename,
            surname: profile.surname,
            displayName: user.displayName,
            level: user.level,
            skinId: user.skinId,
            regCountry: user.regCountry,
            regState: user.regState,
            country: user.country,
            currencyCode: user.currencyCode,
            type: user.type,
            createTime: user.createTime,
            enabled: true
        };

        Logger.debug('Adding new contact', contact);

        await this.crmManager.addContact(contact);
        await this.crmManager.addEvent(user.id, CRMEventType.UserCreated);
    }
}

export const onUserCreated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserCreatedHandler).execute(event));