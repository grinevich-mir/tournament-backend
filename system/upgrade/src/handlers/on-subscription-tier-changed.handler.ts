import { IocContainer, Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { SubscriptionTierChangedEvent } from '@tcom/platform/lib/subscription/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { UserManager } from '@tcom/platform/lib/user';
import { SubscriptionUpgradeManager } from '@tcom/platform/lib/upgrade';
import { SubscriptionManager } from '@tcom/platform/lib/subscription';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnSubscriptionTierChangedHandler extends PlatformEventHandler<SubscriptionTierChangedEvent> {
    constructor(
        @Inject readonly subscriptionManager: SubscriptionManager,
        @Inject readonly upgradeManager: SubscriptionUpgradeManager,
        @Inject readonly userManager: UserManager) {
        super();
    }

    protected async process(event: Readonly<SubscriptionTierChangedEvent>): Promise<void> {
        if (event.fromId === event.toId)
            return;

        const subscription = await this.subscriptionManager.get(event.id);

        if (!subscription) {
            Logger.error(`Subscription ${event.id} not found.`);
            return;
        }

        await this.upgradeManager.updateFromSubscription(subscription);
    }
}

export const onSubscriptionTierChanged = lambdaHandler((event: SNSEvent) => IocContainer.get(OnSubscriptionTierChangedHandler).execute(event));
