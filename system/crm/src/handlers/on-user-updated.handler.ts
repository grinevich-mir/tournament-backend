import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { UserUpdatedEvent } from '@tcom/platform/lib/user/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMManager, ContactUpdate } from '@tcom/platform/lib/crm';
import { UserType } from '@tcom/platform/lib/user';
import { CRMEventType } from '../crm-event-type';

@Singleton
@LogClass()
class OnUserUpdatedHandler extends PlatformEventHandler<UserUpdatedEvent> {
    constructor(
        @Inject private readonly crmManager: CRMManager) {
            super();
    }

    protected async process(event: Readonly<UserUpdatedEvent>): Promise<void> {
        if (event.payload.type === UserType.Bot)
            return;

        const update: ContactUpdate = {
            type: event.payload.type,
            displayName: event.payload.displayName,
            currencyCode: event.payload.currencyCode,
            enabled: event.payload.enabled,
            country: event.payload.country,
            regCountry: event.payload.regCountry,
            regState: event.payload.regState,
            identityStatus: event.payload.identityStatus,
            addressStatus: event.payload.addressStatus
        };

        if (Object.values(update).every(p => p === undefined)) {
            Logger.debug('Nothing to update.');
            return;
        }

        Logger.debug('Updating contact', update);

        await this.crmManager.updateContact(event.payload.id, update);
        await this.crmManager.addEvent(event.payload.id, CRMEventType.UserUpdated, {
            type: event.payload.type,
            displayName: event.payload.displayName,
            currencyCode: event.payload.currencyCode,
            enabled: event.payload.enabled,
            country: event.payload.country,
            regCountry: event.payload.regCountry,
            regState: event.payload.regState,
            identityStatus: event.payload.identityStatus,
            addressStatus: event.payload.addressStatus
        });
    }
}

export const onUserUpdated = lambdaHandler((event: SNSEvent) => IocContainer.get(OnUserUpdatedHandler).execute(event));