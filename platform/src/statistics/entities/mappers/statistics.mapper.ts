import { Singleton } from '../../../core/ioc';
import { StatisticsBaseEntity } from '../statistics-base.entity';
import { Statistics } from '../../statistics';

@Singleton
export class StatisticsEntityMapper {
    public fromEntity(source: StatisticsBaseEntity): Statistics {
        return {
            date: source.date,
            usersNew: source.usersNew,
            tournamentNewUsers: source.tournamentNewUsers,
            tournamentUsers: source.tournamentUsers,
            tournamentEntries: source.tournamentEntries,
            tournamentEntriesAllocations: source.tournamentEntriesAllocations,
            tournamentEntriesDiamondsSpent: source.tournamentEntriesDiamondsSpent,
            tournamentEntriesDiamondsRefunded: source.tournamentEntriesDiamondsRefunded,
            ordersCreated: source.ordersCreated,
            ordersCreatedNewUsers: source.ordersCreatedNewUsers,
            ordersCreatedUsers: source.ordersCreatedUsers,
            ordersCompleted: source.ordersCompleted,
            ordersCompletedNewUsers: source.ordersCompletedNewUsers,
            ordersCompletedUsers: source.ordersCompletedUsers,
            ordersDiamonds: source.ordersDiamonds,
            purchaseNewUserCount: source.purchaseNewUserCount,
            purchaseDeclinedNewUserCount: source.purchaseDeclinedNewUserCount,
            purchaseNewUserRevenue: source.purchaseNewUserRevenue,
            purchaseCount: source.purchaseCount,
            purchaseUserCount: source.purchaseUserCount,
            purchaseDeclinedCount: source.purchaseDeclinedCount,
            purchaseDeclinedUserCount: source.purchaseDeclinedUserCount,
            purchaseFirstTimeUserCount: source.purchaseFirstTimeUserCount,
            purchaseFirstTimeRevenue: source.purchaseFirstTimeRevenue,
            purchaseFirstTimeRevenueInPeriod: source.purchaseFirstTimeRevenueInPeriod,
            purchaseRevenue: source.purchaseRevenue,
            subscriptionsNew: source.subscriptionsNew,
            subscriptionsRenewed: source.subscriptionsRenewed,
            subscriptionsCancelled: source.subscriptionsCancelled,
            subscriptionsNewRevenue: source.subscriptionsNewRevenue,
            subscriptionsRenewedRevenue: source.subscriptionsRenewedRevenue,
            revenue: source.revenue,
            prizePayoutBase: source.prizePayoutBase,
            prizePayoutDiamonds: source.prizePayoutDiamonds,
            jackpotPayout: source.jackpotPayout,
            jackpotPayoutCount: source.jackpotPayoutCount,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}
