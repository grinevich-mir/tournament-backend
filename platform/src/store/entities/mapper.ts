import { Singleton } from '../../core/ioc';
import { NewStoreItem } from '../new-store-item';
import { StoreItem } from '../store-item';
import { StoreItemUpdate } from '../store-item-update';
import { StoreItemEntity } from './store-item.entity';

@Singleton
export class StoreItemEntityMapper {
    public fromEntity(source: StoreItemEntity): StoreItem {
        return {
            id: source.id,
            name: source.name,
            type: source.type,
            quantity: source.quantity,
            price: source.price,
            minLevel: source.minLevel,
            maxLevel: source.maxLevel,
            tag: source.tag,
            priority: source.priority,
            imageUrl: source.imageUrl,
            public: source.public,
            enabled: source.enabled,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public newToEntity(source: NewStoreItem): StoreItemEntity {
        const entity = new StoreItemEntity();
        entity.name = source.name;
        entity.type = source.type;
        entity.quantity = source.quantity;
        entity.price = source.price;
        entity.minLevel = source.minLevel;
        entity.maxLevel = source.maxLevel;
        entity.tag = source.tag;
        entity.priority = source.priority;
        entity.imageUrl = source.imageUrl;
        entity.public = source.public ?? false;
        entity.enabled = source.enabled ?? false;
        return entity;
    }

    public updateToEntity(id: number, source: StoreItemUpdate): StoreItemEntity {
        const entity = new StoreItemEntity();
        entity.id = id;
        entity.name = source.name;
        entity.type = source.type;
        entity.quantity = source.quantity;
        entity.price = source.price;
        entity.minLevel = source.minLevel;
        entity.maxLevel = source.maxLevel;
        entity.tag = source.tag as string;
        entity.priority = source.priority as number;
        entity.imageUrl = source.imageUrl as string;
        entity.public = source.public ?? entity.public;
        return entity;
    }
}