import { IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { SubscriptionRenewedEvent } from '@tcom/platform/lib/subscription/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class OnSubscriptionRenewedHandler extends PlatformEventHandler<SubscriptionRenewedEvent> {
    constructor(
        ) {
        super();
    }

    protected async process(event: Readonly<SubscriptionRenewedEvent>): Promise<void> {
    }
}

export const onSubscriptionRenewed = lambdaHandler((event: SNSEvent) => IocContainer.get(OnSubscriptionRenewedHandler).execute(event));
