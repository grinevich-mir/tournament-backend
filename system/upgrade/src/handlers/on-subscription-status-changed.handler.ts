import { IocContainer, Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { SubscriptionStatusChangedEvent } from '@tcom/platform/lib/subscription/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { SubscriptionUpgradeManager } from '@tcom/platform/lib/upgrade';
import { SubscriptionManager } from '@tcom/platform/lib/subscription';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnSubscriptionStatusChangedHandler extends PlatformEventHandler<SubscriptionStatusChangedEvent> {
    constructor(
        @Inject private readonly subscriptionManager: SubscriptionManager,
        @Inject private readonly upgradeManager: SubscriptionUpgradeManager) {
        super();
    }

    protected async process(event: Readonly<SubscriptionStatusChangedEvent>): Promise<void> {
        if (event.from === event.to)
            return;

        const subscription = await this.subscriptionManager.get(event.id);

        if (!subscription) {
            Logger.error(`Subscription ${event.id} not found.`);
            return;
        }

        await this.upgradeManager.updateFromSubscription(subscription);
    }
}

export const onSubscriptionStatusChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnSubscriptionStatusChangedHandler).execute(event));
