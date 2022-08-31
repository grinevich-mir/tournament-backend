import { InventoryItemType } from '../inventory-type';

interface NewInventoryItemBaseModel {
    userId: number;
    type: InventoryItemType;
    expiresIn?: number;
}

interface NewUpgradeInventoryItemModel extends NewInventoryItemBaseModel {
    level: number;
    duration: number;
}

export type NewInventoryItemModel = NewUpgradeInventoryItemModel;
