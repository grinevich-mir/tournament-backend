import { Singleton } from '../../../core/ioc';
import { Upgrade, ScheduledUpgrade, SubscriptionUpgrade, ManualUpgrade } from '../../upgrade';
import { ScheduledUpgradeEntity, SubscriptionUpgradeEntity, ManualUpgradeEntity } from '../upgrade.entity';
import { UpgradeType } from '../../upgrade-type';

type UpgradeEntities = ScheduledUpgradeEntity | SubscriptionUpgradeEntity | ManualUpgradeEntity;

@Singleton
export class UpgradeEntityMapper {
    public fromEntity(source: ScheduledUpgradeEntity): ScheduledUpgrade;
    public fromEntity(source: SubscriptionUpgradeEntity): SubscriptionUpgrade;
    public fromEntity(source: ManualUpgradeEntity): ManualUpgrade;
    public fromEntity(source: UpgradeEntities): Upgrade {
        if (source instanceof ScheduledUpgradeEntity)
            return {
                type: UpgradeType.Scheduled,
                userId: source.userId,
                id: source.id,
                startTime: source.startTime,
                endtime: source.endTime,
                level: source.level,
                status: source.status,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        if (source instanceof SubscriptionUpgradeEntity)
            return {
                type: UpgradeType.Subscription,
                userId: source.userId,
                id: source.id,
                subscriptionId: source.subscriptionId,
                level: source.level,
                status: source.status,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        if (source instanceof ManualUpgradeEntity)
            return {
                type: UpgradeType.Manual,
                userId: source.userId,
                id: source.id,
                level: source.level,
                status: source.status,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        throw new Error(`Unsupported upgrade type '${source}'.`);
    }
}