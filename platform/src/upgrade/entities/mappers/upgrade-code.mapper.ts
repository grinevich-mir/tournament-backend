import { UpgradeCodeEntity } from '../upgrade-code.entity';
import { Singleton } from '../../../core/ioc';
import { UpgradeCode } from '../../upgrade-code';
import { NewUpgradeCode } from '../../new-upgrade-code';

@Singleton
export class UpgradeCodeEntityMapper {
    public fromEntity(source: UpgradeCodeEntity): UpgradeCode {
        return {
            userId: source.userId,
            code: source.code,
            upgradeLevel: source.upgradeLevel,
            upgradeDuration: source.upgradeDuration,
            diamonds: source.diamonds,
            processExpireTime: source.processExpireTime,
            processTime: source.processTime,
            processedBy: source.processedBy,
            inventoryItemIds: source.inventoryItems.map(i => i.id),
            createTime: source.createTime,
            expireTime: source.expireTime
        };
    }

    public newToEntity(source: NewUpgradeCode): UpgradeCodeEntity {
        const entity = new UpgradeCodeEntity();
        entity.userId = source.userId;
        entity.code = source.code;
        entity.upgradeLevel = source.upgradeLevel;
        entity.upgradeDuration = source.upgradeDuration;
        entity.diamonds = source.diamonds;
        entity.processExpireTime = source.processExpireTime;
        entity.expireTime = source.expireTime;
        entity.inventoryItems = [];
        return entity;
    }
}