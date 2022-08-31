import { PlatformEventDispatcher } from '@tcom/platform/lib/core/events';
import { Inject, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { Subscription } from '@tcom/platform/lib/subscription';
import { SubscriptionRenewedEvent } from '@tcom/platform/lib/subscription/events';
import { RenewalSuccessNotificationModel } from '../../models';
import { NotificationProcessor } from '../notification-processor';

@Singleton
@LogClass()
export class RenewalNotificationProcessor implements NotificationProcessor<RenewalSuccessNotificationModel> {
    constructor(
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
    }

    public async process(_skinId: string, _notification: RenewalSuccessNotificationModel, subscription?: Subscription): Promise<void> {
        if (!subscription)
            return;

        await this.eventDispatcher.send(new SubscriptionRenewedEvent(subscription.id, subscription));
    }
}