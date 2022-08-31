import { Singleton } from '../core/ioc';
import { UpgradeStatus } from './upgrade-status';
import { SubscriptionStatus } from '../subscription/subscription-status';

@Singleton
export class UpgradeStatusMapper {
    public fromSubscription(status: SubscriptionStatus): UpgradeStatus {
        switch (status) {
            default:
                return UpgradeStatus.Pending;

            case SubscriptionStatus.Active:
            case SubscriptionStatus.Cancelled:
                return UpgradeStatus.Active;

            case SubscriptionStatus.Paused:
            case SubscriptionStatus.PastDue:
                return UpgradeStatus.Paused;

            case SubscriptionStatus.Expired:
                return UpgradeStatus.Expired;
        }
    }
}