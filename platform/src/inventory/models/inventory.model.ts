import { InventoryItemType } from '../inventory-type';

interface InventoryItemBaseModel {
    id: number;
    type: InventoryItemType;
    claimed: boolean;
    claimedTime?: Date;
    expires?: Date;
    createTime: Date;
}

export interface UpgradeInventoryItemModel extends InventoryItemBaseModel {
    type: InventoryItemType.Upgrade;
    validDays: number;
    level: number;
}

export interface DiamondInventoryItemModel extends InventoryItemBaseModel {
    type: InventoryItemType.Diamonds;
    amount: number;
}

export type InventoryItemModel = UpgradeInventoryItemModel | DiamondInventoryItemModel;