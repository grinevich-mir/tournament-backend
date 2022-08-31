import { InventoryItemType } from './inventory-type';

interface InventoryItemBase {
    type: InventoryItemType;
    id: number;
    userId: number;
    claimed: boolean;
    claimedTime?: Date;
    expires?: Date;
    enabled: boolean;
    createTime: Date;
}

export interface UpgradeInventoryItem extends InventoryItemBase {
    type: InventoryItemType.Upgrade;
    validDays: number;
    level: number;
}

export interface DiamondInventoryItem extends InventoryItemBase {
    type: InventoryItemType.Diamonds;
    amount: number;
}

export type InventoryItem = UpgradeInventoryItem | DiamondInventoryItem;