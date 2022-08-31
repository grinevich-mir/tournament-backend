import { UpgradeType } from './upgrade-type';
import { UpgradeStatus } from './upgrade-status';

interface UpgradeBase {
    id: number;
    type: UpgradeType;
    userId: number;
    status: UpgradeStatus;
    level: number;
    createTime: Date;
    updateTime: Date;
}

export interface ScheduledUpgrade extends UpgradeBase {
    type: UpgradeType.Scheduled;
    startTime: Date;
    endtime: Date;
}

export interface SubscriptionUpgrade extends UpgradeBase {
    type: UpgradeType.Subscription;
    subscriptionId: number;
}

export interface ManualUpgrade extends UpgradeBase {
    type: UpgradeType.Manual;
}

export type Upgrade = ScheduledUpgrade | SubscriptionUpgrade | ManualUpgrade;