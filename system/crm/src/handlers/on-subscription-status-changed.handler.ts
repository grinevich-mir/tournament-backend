import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { SubscriptionStatusChangedEvent } from '@tcom/platform/lib/subscription/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { ContactUpdate, CRMManager } from '@tcom/platform/lib/crm';
import { SubscriptionManager, SubscriptionStatus } from '@tcom/platform/lib/subscription';
import { CRMEventType } from '../crm-event-type';

@Singleton
@LogClass()
class OnSubscriptionStatusChangedHandler extends PlatformEventHandler<SubscriptionStatusChangedEvent> {
    constructor(
        @Inject private readonly crmManager: CRMManager,
        @Inject private readonly subscriptionManager: SubscriptionManager) {
            super();
    }

    protected async process(event: Readonly<SubscriptionStatusChangedEvent>): Promise<void> {
        let subscription = event.subscription;

        if (!subscription) {
            const platformSub = await this.subscriptionManager.get(event.id);

            if (!platformSub) {
                Logger.error(`Subscription ${event.id} not found.`);
                return;
            }

            subscription = platformSub;
        }

        let eventType: CRMEventType | undefined;

        const contactUpdate: ContactUpdate = {
            hasSubscribed: true,
            hasActiveSubscription: true,
            subscriptionCancelling: false,
            subscriptionPastDue: false
        };

        if (event.from === SubscriptionStatus.Pending && event.to === SubscriptionStatus.Active) {
            contactUpdate.lastSubscribed = subscription.createTime;
            eventType = CRMEventType.SubscriptionCreated;
        }

        if (event.from === SubscriptionStatus.Active && event.to === SubscriptionStatus.Cancelled) {
            contactUpdate.subscriptionCancelling = true;
            eventType = CRMEventType.SubscriptionCancelling;
        }

        if (event.from === SubscriptionStatus.Cancelled && event.to === SubscriptionStatus.Active)
            eventType = CRMEventType.SubscriptionReactivated;

        if (event.to === SubscriptionStatus.Expired) {
            contactUpdate.hasActiveSubscription = false;
            eventType = event.from === SubscriptionStatus.Cancelled ? CRMEventType.SubscriptionCancelled : CRMEventType.SubscriptionExpired;
        }

        if (event.to === SubscriptionStatus.PastDue) {
            contactUpdate.subscriptionPastDue = true;
            eventType = CRMEventType.SubscriptionPastDue;
        }

        await this.crmManager.updateContact(subscription.userId, contactUpdate);

        if (!eventType)
            return;

        await this.crmManager.addEvent(subscription.userId, eventType, {
            subscriptionId: event.id,
            trialling: subscription.trialling,
            level: subscription.level
        });
    }
}

export const onSubscriptionStatusChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnSubscriptionStatusChangedHandler).execute(event));