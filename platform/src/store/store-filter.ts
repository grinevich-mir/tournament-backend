import { PagedFilter } from '../core';
import { StoreItem } from './store-item';
import { StoreItemType } from './store-item-type';

export interface StoreFilter {
    type?: StoreItemType;
    level?: number;
    enabled?: boolean;
    public?: boolean;
}
export interface StoreGetAllFilter extends StoreFilter, PagedFilter<StoreItem> {
}