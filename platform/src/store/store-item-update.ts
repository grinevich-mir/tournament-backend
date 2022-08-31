import { StoreItemType } from './store-item-type';

export interface StoreItemUpdate {
    name: string;
    type: StoreItemType;
    price: number;
    minLevel: number;
    maxLevel: number;
    tag?: string | null;
    priority?: number | null;
    quantity: number;
    imageUrl?: string | null;
    public?: boolean | null;
}