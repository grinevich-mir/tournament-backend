import { Ledger, PlatformWallets, RequesterType, TransactionPurpose, UserWalletAccounts } from '../../banking';
import { Inject, Singleton } from '../../core/ioc';
import { LogClass } from '../../core/logging';
import { Order } from '../order';
import { OrderItem } from '../order-item';
import { OrderItemProcessor } from './order-item-processor';

@Singleton
@LogClass()
export class DiamondOrderItemProcessor implements OrderItemProcessor {
    constructor(@Inject private readonly ledger: Ledger) {
    }

    public async process(order: Order, item: OrderItem): Promise<void> {
        await this.ledger.transfer(item.quantity, 'DIA')
            .purpose(TransactionPurpose.Purchase)
            .requestedBy(RequesterType.System, 'Ordering')
            .externalRef(`order-${order.id}-item-${item.id}`)
            .memo(`Order ${order.id} item ${item.id}`)
            .fromPlatform(PlatformWallets.Corporate)
            .toUser(order.userId, UserWalletAccounts.Diamonds)
            .commit();
    }
}