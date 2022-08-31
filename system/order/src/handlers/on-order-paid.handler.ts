import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { OrderProcessor, OrderStatus } from '@tcom/platform/lib/order';
import { OrderStatusChangedEvent } from '@tcom/platform/lib/order/events';

@Singleton
@LogClass()
class OnOrderPaidHandler extends PlatformEventHandler<OrderStatusChangedEvent> {
    constructor(
        @Inject private readonly orderProcessor: OrderProcessor) {
            super();
    }

    protected async process(event: Readonly<OrderStatusChangedEvent>): Promise<void> {
        if (event.to !== OrderStatus.Paid)
            return;

        try {
            await this.orderProcessor.process(event.id);
        } catch (err) {
            Logger.error(err);
        }
    }
}

export const onOrderPaid = lambdaHandler((event: SNSEvent) => IocContainer.get(OnOrderPaidHandler).execute(event));