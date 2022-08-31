import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { CRMSender, CRMTemplateName } from '@tcom/platform/lib/crm';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { OrderStatusChangedEvent } from '@tcom/platform/lib/order/events';
import { OrderManager, OrderStatus } from '@tcom/platform/lib/order';
import { SNSEvent } from 'aws-lambda';
import { lambdaHandler, NotFoundError } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { UserNotificationType, UserManager } from '@tcom/platform/lib/user';
import { formatMoney } from '@tcom/platform/lib/banking/utilities';
import _ from 'lodash';

@Singleton
@LogClass()
class OnOrderPaidHandler extends PlatformEventHandler<OrderStatusChangedEvent> {
    constructor(
        @Inject private readonly orderManager: OrderManager,
        @Inject private readonly crmSender: CRMSender,
        @Inject private readonly userManager: UserManager) {
        super();
    }

    protected async process(event: Readonly<OrderStatusChangedEvent>): Promise<void> {
        if (event.to !== OrderStatus.Paid)
            return;

        if (event.from !== OrderStatus.PendingPayment)
            return;

        const order = await this.orderManager.get(event.id);

        if (!order)
            throw new NotFoundError(`Order not found.`);

        const user = await this.userManager.get(order.userId);

        if (!user)
            return;

        await this.crmSender.send(order.userId, UserNotificationType.Account, CRMTemplateName.OrderPaid, {
            data: {
                userDisplayName: user.displayName || 'Anonymous',
                orderId: order.id,
                orderDate: order.createTime,
                orderDescription: order.description,
                orderPriceTotal: formatMoney(order.priceTotal, order.currencyCode)
            }
        });
    }
}

export const onOrderPaid = lambdaHandler((event: SNSEvent) => IocContainer.get(OnOrderPaidHandler).execute(event));