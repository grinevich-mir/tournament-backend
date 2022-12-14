export interface Statistics {
    date: Date;
    usersNew: number;
    tournamentNewUsers: number;
    tournamentUsers: number;
    tournamentEntries: number;
    tournamentEntriesAllocations: number;
    tournamentEntriesDiamondsSpent: number;
    tournamentEntriesDiamondsRefunded: number;
    ordersCreated: number;
    ordersCreatedNewUsers: number;
    ordersCreatedUsers: number;
    ordersCompleted: number;
    ordersCompletedNewUsers: number;
    ordersCompletedUsers: number;
    ordersDiamonds: number;
    purchaseNewUserCount: number;
    purchaseDeclinedNewUserCount: number;
    purchaseNewUserRevenue: number;
    purchaseFirstTimeUserCount: number;
    purchaseFirstTimeRevenue: number;
    purchaseFirstTimeRevenueInPeriod: number;
    purchaseUserCount: number;
    purchaseCount: number;
    purchaseRevenue: number;
    purchaseDeclinedUserCount: number;
    purchaseDeclinedCount: number;
    subscriptionsNew: number;
    subscriptionsRenewed: number;
    subscriptionsCancelled: number;
    subscriptionsNewRevenue: number;
    subscriptionsRenewedRevenue: number;
    revenue: number;
    prizePayoutBase: number;
    prizePayoutDiamonds: number;
    jackpotPayout: number;
    jackpotPayoutCount: number;
    createTime: Date;
    updateTime: Date;
}
