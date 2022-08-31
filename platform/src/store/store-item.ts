import { NewStoreItem } from './new-store-item';

export interface StoreItem extends NewStoreItem {
    id: number;
    createTime: Date;
    updateTime: Date;
}
