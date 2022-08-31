import { InventoryItemType } from '../inventory-type';
import { InventoryClaimAwarder } from './inventory-claim-awarder';
import { IocContainer, Singleton } from '../../core/ioc';
import { UpgradeInventoryClaimAwarder } from './upgrade-inventory-claim.awarder';
import { LogClass } from '../../core/logging';
import { DiamondInventoryClaimAwarder } from './diamond-inventory-claim.awarder';

@Singleton
@LogClass()
export class InventoryClaimAwarderFactory {
    public create(type: InventoryItemType): InventoryClaimAwarder {
        switch (type) {
            case InventoryItemType.Upgrade:
                return IocContainer.get(UpgradeInventoryClaimAwarder);

            case InventoryItemType.Diamonds:
                return IocContainer.get(DiamondInventoryClaimAwarder);
        }
    }
}