import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { SubscriptionRenewedEvent } from '@tcom/platform/lib/subscription/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMManager } from '@tcom/platform/lib/crm';
import { CRMEventType } from '../crm-event-type';

@Singleton
@LogClass()
class OnSubscriptionRenewedHandler extends PlatformEventHandler<SubscriptionRenewedEvent> {
    constructor(
        @Inject private readonly crmManager: CRMManager) {
            super();
    }

    protected async process(event: Readonly<SubscriptionRenewedEvent>): Promise<void> {
        await this.crmManager.addEvent(event.subscription.userId, CRMEventType.SubscriptionRenewed, {
            subscriptionId: event.id
        });
    }
}

export const onSubscriptionRenewed = lambdaHandler((event: SNSEvent) => IocContainer.get(OnSubscriptionRenewedHandler).execute(event));
