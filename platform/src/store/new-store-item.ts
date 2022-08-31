import { StoreItemType } from './store-item-type';

export interface NewStoreItem {
    name: string;
    type: StoreItemType;
    price: number;
    minLevel: number;
    maxLevel: number;
    tag?: string;
    priority?: number;
    quantity: number;
    imageUrl?: string;
    public?: boolean;
    enabled?: boolean;
}