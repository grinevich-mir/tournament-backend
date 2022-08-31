import { Singleton } from '../../core/ioc';
import { DiamondInventoryItemEntity, InventoryItemEntity, UpgradeInventoryItemEntity } from './inventory-item.entity';
import { InventoryItem } from '../inventory-item';
import { InventoryItemType } from '../inventory-type';
import { NewInventoryItem } from '../new-inventory-item';
import moment from 'moment';

@Singleton
export class InventoryItemEntityMapper {
    public fromEntity(source: InventoryItemEntity): InventoryItem {
        if (source instanceof UpgradeInventoryItemEntity)
            return {
                type: InventoryItemType.Upgrade,
                id: source.id,
                claimed: !!source.claimedTime,
                claimedTime: source.claimedTime,
                level: source.level,
                userId: source.userId,
                createTime: source.createTime,
                validDays: source.validDays,
                expires: source.expires,
                enabled: true
            };

        if (source instanceof DiamondInventoryItemEntity)
            return {
                type: InventoryItemType.Diamonds,
                id: source.id,
                claimed: !!source.claimedTime,
                claimedTime: source.claimedTime,
                amount: source.amount,
                userId: source.userId,
                createTime: source.createTime,
                expires: source.expires,
                enabled: true
            };

        throw new Error(`Inventory item type ${source.type} not supported.`);
    }

    public newToEntity(source: NewInventoryItem): InventoryItemEntity {
        let entity: UpgradeInventoryItemEntity | DiamondInventoryItemEntity | undefined;

        switch (source.type) {
            case InventoryItemType.Upgrade:
                entity = new UpgradeInventoryItemEntity();
                entity.level = source.level;
                entity.validDays = source.validDays;
                break;

            case InventoryItemType.Diamonds:
                entity = new DiamondInventoryItemEntity();
                entity.amount = source.amount;
                break;
        }

        if (!entity)
            throw new Error(`Inventory item type ${source.type} not supported.`);

        entity.type = source.type;
        entity.userId = source.userId;
        entity.expires = source.expiresIn ? moment.utc().add(source.expiresIn, 'days').toDate() : undefined;
        entity.enabled = source.enabled === undefined ? true : source.enabled;
        return entity;
    }
}