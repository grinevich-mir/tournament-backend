import { InventoryItem } from '../inventory-item';

export interface InventoryClaimAwarder {
    award(item: InventoryItem): Promise<void>;
}