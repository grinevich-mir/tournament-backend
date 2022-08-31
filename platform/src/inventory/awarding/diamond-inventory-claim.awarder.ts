import { Singleton, Inject } from '../../core/ioc';
import { InventoryClaimAwarder } from './inventory-claim-awarder';
import { DiamondInventoryItem } from '../inventory-item';
import { LogClass } from '../../core/logging';
import { Ledger, PlatformWallets, RequesterType, TransactionPurpose, UserWalletAccounts } from '../../banking';

@Singleton
@LogClass()
export class DiamondInventoryClaimAwarder implements InventoryClaimAwarder {
    constructor(
        @Inject private readonly ledger: Ledger) {
        }

    public async award(item: DiamondInventoryItem): Promise<void> {
       await this.ledger.transfer(item.amount, 'DIA')
            .purpose(TransactionPurpose.Promotion)
            .requestedBy(RequesterType.System, 'Inventory')
            .externalRef(`Inventory:${item.id}`)
            .memo(`Claim of ${item.amount} diamond(s) inventory item`)
            .fromPlatform(PlatformWallets.Corporate)
            .toUser(item.userId, UserWalletAccounts.Diamonds)
            .commit();
    }
}