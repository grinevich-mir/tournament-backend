import { InventoryItemType } from './inventory-type';
import { InventoryItem } from './inventory-item';
import { PagedFilter } from '../core';

export interface InventoryFilter {
    claimed?: boolean;
    expired?: boolean;
    type?: InventoryItemType;
    userId?: number;
    enabled?: boolean;
}
export interface InventoryGetAllFilter extends InventoryFilter, PagedFilter<InventoryItem> {
}