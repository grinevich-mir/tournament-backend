import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { OrderManager } from '@tcom/platform/lib/order';
import { lambdaHandler } from '@tcom/platform/lib/core';

@Singleton
@LogClass()
export class ExpireOrdersHandler {
    constructor(
        @Inject private readonly orderManager: OrderManager) {
    }

    public async execute(): Promise<void> {
        await this.orderManager.expire(20);
    }
}

export const expireOrders = lambdaHandler(() => IocContainer.get(ExpireOrdersHandler).execute());