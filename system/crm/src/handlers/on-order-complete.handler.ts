import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { ContactUpdate, CRMManager } from '@tcom/platform/lib/crm';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { OrderStatusChangedEvent } from '@tcom/platform/lib/order/events';
import { OrderItemType, OrderManager, OrderStatus } from '@tcom/platform/lib/order';
import { SNSEvent } from 'aws-lambda';
import { lambdaHandler, NotFoundError } from '@tcom/platform/lib/core';
import { CRMEventType } from '../crm-event-type';
import { LogClass } from '@tcom/platform/lib/core/logging';
import _ from 'lodash';

@Singleton
@LogClass()
class OnOrderCompleteHandler extends PlatformEventHandler<OrderStatusChangedEvent> {

    constructor(
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly crmManager: CRMManager) {
        super();
    }

    protected async process(event: Readonly<OrderStatusChangedEvent>): Promise<void> {
        if (event.to !== OrderStatus.Complete)
            return;

        const order = await this.orderManager.get(event.id);

        if (!order)
            throw new NotFoundError(`Order not found.`);

        if (order.priceTotal === 0 || order.status !== OrderStatus.Complete)
            return;

        const update: ContactUpdate = {
            lastPurchased: order.completeTime,
            hasPurchased: true,
        };

        if (order.items.some((i) => i.type === OrderItemType.Diamonds)) {
            update.hasPurchasedDiamonds = true;
            update.lastPurchasedDiamonds = order.completeTime;
            await this.crmManager.addEvent(order.userId, CRMEventType.HasPurchasedDiamonds);
        }

        await this.crmManager.updateContact(order.userId, update);

        await this.crmManager.addEvent(order.userId, CRMEventType.HasPurchased);
    }
}

export const onOrderComplete = lambdaHandler((event: SNSEvent) => IocContainer.get(OnOrderCompleteHandler).execute(event));
