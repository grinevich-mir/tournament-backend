import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import _ from 'lodash';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { EmailSender } from '../email-sender';
import moment from 'moment';
import { Statistics, StatisticsFilter, StatisticsManager, StatisticsTotals } from '@tcom/platform/lib/statistics';
import { formatMoney } from '@tcom/platform/lib/banking/utilities';
import { SubscriptionManager } from '@tcom/platform/lib/subscription';
import { ActiveSubscriptionsAndRevenue } from '@tcom/platform/lib/subscription/active-subscriptions-and-revenue';
import { EmailGroup } from '../email-group';

type MappedStatistics = Record<keyof Omit<Statistics, 'createTime' | 'updateTime'>, string> & {
    usersCount: string;
    ordersCreatedExistingUsers: string;
    ordersCompletedExistingUsers: string;
    purchaseNewUserConversion: string;
    purchaseFirstTimeConversion: string;
    purchaseExistingUserCount: string;
    purchaseExistingUserRevenue: string;
    purchaseDeclinedExistingUserCount: string;
    purchaseAverageRevenue: string;
    purchaseUserAverageRevenue: string;
    subscriptionsActiveTotal: string;
    subscriptionEstimatedMonthlyRevenue: string;
    tournamentExistingUsers: string;
};

interface ReportEvent {
    date?: string;
    recipients?: string[];
}

@Singleton
@LogClass()
export class DailyReportHandler {
    constructor(
        @Inject private readonly emailSender: EmailSender,
        @Inject private readonly statsManager: StatisticsManager,
        @Inject private readonly subsManager: SubscriptionManager) {
    }

    public async execute(event: ReportEvent): Promise<void> {
        const targetDate = event.date ? moment(event.date).toDate() : moment().subtract(1, 'day').toDate();
        const previousDate = moment(targetDate).subtract(1, 'day').toDate();

        const statsFilter: StatisticsFilter = {
            from: previousDate,
            to: targetDate,
            skip: 0,
            take: 1,
        };

        const statsData: Statistics[] = await this.statsManager.getDaily(statsFilter);
        const totals = await this.statsManager.getTotals();
        const subscriptionData = await this.subsManager.getCurrentActiveAndEstimatedRevenue();

        const singleDay = this.formatData(statsData[0], subscriptionData, totals);

        await this.emailSender.test('TournamentDailyReport', singleDay);

        if (event.recipients && event.recipients.length > 0) {
            await this.emailSender.sendTo(event.recipients, 'TournamentDailyReport', singleDay);
            return;
        }

        await this.emailSender.send('TournamentDailyReport', singleDay, EmailGroup.Admin);
    }

    private formatData(sourceStats: Statistics, subscriptionData: ActiveSubscriptionsAndRevenue, totals: StatisticsTotals): MappedStatistics {
        return {
            date: moment(sourceStats.date).format('DD/MM/YYYY'),
            usersNew: sourceStats.usersNew.toLocaleString(),
            usersCount: totals.totalSignUps.toLocaleString(),
            tournamentNewUsers: sourceStats.tournamentNewUsers.toLocaleString(),
            tournamentUsers: sourceStats.tournamentUsers.toLocaleString(),
            tournamentExistingUsers: (sourceStats.tournamentUsers - sourceStats.tournamentNewUsers).toLocaleString(),
            tournamentEntries: sourceStats.tournamentEntries.toLocaleString(),
            tournamentEntriesAllocations: sourceStats.tournamentEntriesAllocations.toLocaleString(),
            tournamentEntriesDiamondsSpent: sourceStats.tournamentEntriesDiamondsSpent.toLocaleString(),
            tournamentEntriesDiamondsRefunded: sourceStats.tournamentEntriesDiamondsRefunded.toLocaleString(),
            ordersCreated: sourceStats.ordersCreated.toLocaleString(),
            ordersCreatedNewUsers: sourceStats.ordersCreatedNewUsers.toLocaleString(),
            ordersCreatedUsers: sourceStats.ordersCreatedUsers.toLocaleString(),
            ordersCreatedExistingUsers: (sourceStats.ordersCreatedUsers - sourceStats.ordersCreatedNewUsers).toLocaleString(),
            ordersCompleted: sourceStats.ordersCompleted.toLocaleString(),
            ordersCompletedNewUsers: sourceStats.ordersCompletedNewUsers.toLocaleString(),
            ordersCompletedUsers: sourceStats.ordersCompletedUsers.toLocaleString(),
            ordersCompletedExistingUsers: (sourceStats.ordersCompletedUsers - sourceStats.ordersCompletedNewUsers).toLocaleString(),
            ordersDiamonds: sourceStats.ordersDiamonds.toLocaleString(),
            purchaseNewUserCount: sourceStats.purchaseNewUserCount.toLocaleString(),
            purchaseNewUserConversion: sourceStats.usersNew ? `${(sourceStats.purchaseNewUserCount / (sourceStats.usersNew) * 100).toFixed(2)}%` : `0%`,
            purchaseDeclinedNewUserCount: sourceStats.purchaseDeclinedNewUserCount.toLocaleString(),
            purchaseNewUserRevenue: formatMoney(sourceStats.purchaseNewUserRevenue, 'USD'),
            purchaseFirstTimeUserCount: sourceStats.purchaseFirstTimeUserCount.toLocaleString(),
            purchaseFirstTimeConversion: `${((sourceStats.purchaseFirstTimeUserCount / (sourceStats.usersNew || 1)) * 100).toFixed(2)}%`,
            purchaseFirstTimeRevenue: formatMoney(sourceStats.purchaseFirstTimeRevenue, 'USD'),
            purchaseFirstTimeRevenueInPeriod: formatMoney(sourceStats.purchaseFirstTimeRevenueInPeriod, 'USD'),
            purchaseExistingUserCount: (sourceStats.purchaseUserCount - sourceStats.purchaseNewUserCount).toLocaleString(),
            purchaseExistingUserRevenue: formatMoney(sourceStats.purchaseRevenue - sourceStats.purchaseNewUserRevenue, 'USD'),
            purchaseUserCount: sourceStats.purchaseUserCount.toLocaleString(),
            purchaseDeclinedUserCount: sourceStats.purchaseDeclinedUserCount.toLocaleString(),
            purchaseDeclinedExistingUserCount: (sourceStats.purchaseDeclinedUserCount - sourceStats.purchaseDeclinedNewUserCount).toLocaleString(),
            purchaseCount: sourceStats.purchaseCount.toLocaleString(),
            purchaseDeclinedCount: sourceStats.purchaseDeclinedCount.toLocaleString(),
            purchaseRevenue: formatMoney(sourceStats.purchaseRevenue, 'USD'),
            purchaseAverageRevenue: formatMoney(sourceStats.purchaseRevenue && sourceStats.purchaseCount ? (sourceStats.purchaseRevenue / sourceStats.purchaseCount) : 0, 'USD'),
            purchaseUserAverageRevenue: formatMoney(sourceStats.purchaseRevenue && sourceStats.purchaseUserCount ? (sourceStats.purchaseRevenue / sourceStats.purchaseUserCount) : 0, 'USD'),
            prizePayoutBase: formatMoney(sourceStats.prizePayoutBase, 'USD'),
            prizePayoutDiamonds: sourceStats.prizePayoutDiamonds.toLocaleString(),
            jackpotPayout: formatMoney(sourceStats.jackpotPayout, 'USD'),
            jackpotPayoutCount: sourceStats.jackpotPayoutCount.toLocaleString(),
            subscriptionsActiveTotal: subscriptionData.currentTotalActiveSubscriptions.toLocaleString(),
            subscriptionEstimatedMonthlyRevenue: formatMoney(subscriptionData.estimatedMonthlyRevenue, 'USD'),
            subscriptionsNew: sourceStats.subscriptionsNew.toLocaleString(),
            subscriptionsRenewed: sourceStats.subscriptionsRenewed.toLocaleString(),
            subscriptionsCancelled: sourceStats.subscriptionsCancelled.toLocaleString(),
            subscriptionsNewRevenue: formatMoney(sourceStats.subscriptionsNewRevenue, 'USD'),
            subscriptionsRenewedRevenue: formatMoney(sourceStats.subscriptionsRenewedRevenue, 'USD'),
            revenue: formatMoney(sourceStats.revenue, 'USD')
        };
    }
}

export const dailyReport = lambdaHandler((event: ReportEvent) => IocContainer.get(DailyReportHandler).execute(event));
