import { Singleton } from '../../core/ioc';
import { InventoryItemModel } from './inventory.model';
import { InventoryItem } from '../inventory-item';
import { InventoryItemType } from '../inventory-type';

@Singleton
export class InventoryModelMapper {
    public mapAll(source: InventoryItem[]): InventoryItemModel[] {
        return source.map(t => this.map(t));
    }

    public map(source: InventoryItem): InventoryItemModel {
        switch (source.type) {
            case InventoryItemType.Upgrade:
                return {
                    id: source.id,
                    type: InventoryItemType.Upgrade,
                    claimed: source.claimed,
                    claimedTime: source.claimedTime,
                    level: source.level,
                    validDays: source.validDays,
                    expires: source.expires,
                    createTime: source.createTime
                };

            case InventoryItemType.Diamonds:
                return {
                    id: source.id,
                    type: InventoryItemType.Diamonds,
                    claimed: source.claimed,
                    claimedTime: source.claimedTime,
                    amount: source.amount,
                    expires: source.expires,
                    createTime: source.createTime
                };
        }
    }
}
