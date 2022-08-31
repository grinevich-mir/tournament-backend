import { InventoryItemType } from './inventory-type';

interface NewInventoryItemBase {
    userId: number;
    type: InventoryItemType;
    expiresIn?: number;
    enabled?: boolean;
}

export interface NewUpgradeInventoryItem extends NewInventoryItemBase {
    type: InventoryItemType.Upgrade;
    validDays: number;
    level: number;
}

export interface NewDiamondInventoryItem extends NewInventoryItemBase {
    type: InventoryItemType.Diamonds;
    amount: number;
}

export type NewInventoryItem = NewUpgradeInventoryItem | NewDiamondInventoryItem;