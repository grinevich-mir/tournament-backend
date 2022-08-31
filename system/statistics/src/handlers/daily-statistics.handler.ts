import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { GlobalDB } from '@tcom/platform/lib/core/db';
import { StatisticsDailyEntity } from '@tcom/platform/lib/statistics/entities';
import moment from 'moment';

interface GenerateEvent {
    date?: string;
}

@Singleton
@LogClass()
class DailyStatisticsHandler {
    constructor(@Inject private readonly db: GlobalDB) {
    }

    public async execute(event: GenerateEvent): Promise<void> {
        if (event.date) {
            await this.getStatistics(moment(event.date).toDate());
            return;
        }

        const tableDate = await this.getCurrentTableDate();
        const currentDate = new Date();

        while (tableDate < currentDate) {
            await this.getStatistics(tableDate);
            tableDate.setUTCDate(tableDate.getUTCDate() + 1);
        }
    }

    private async getStatistics(date: Date) {
        const connection = await this.db.getConnection();

        const dateStr = date.toISOString().split('T')[0];
        Logger.info(`Processing Daily Statistics ${dateStr}`);

        const query = `
            SELECT * FROM
            (
                (${this.getNewUserCount(dateStr)}) as usersNew,
                (${this.getTournamentNewUsers(dateStr)}) as tournamentNewUsers,
                (${this.getTournamentUsers(dateStr)}) as tournamentUsers,
                (${this.getTournamentEntries(dateStr)}) as tournamentEntries,
                (${this.getTournamentEntriesAllocations(dateStr)}) as tournamentEntriesAllocations,
                (${this.getTournamentEntriesDiamondsSpent(dateStr)}) as tournamentEntriesDiamondsSpent,
                (${this.getTournamentEntriesDiamondsRefunded(dateStr)}) as tournamentEntriesDiamondsRefunded,
                (${this.getOrdersCreated(dateStr)}) as ordersCreated,
                (${this.getOrdersCreatedNewUsers(dateStr)}) as ordersCreatedNewUsers,
                (${this.getOrdersCreatedUsers(dateStr)}) as ordersCreatedUsers,
                (${this.getOrdersCompleted(dateStr)}) as ordersCompleted,
                (${this.getOrdersCompletedNewUsers(dateStr)}) as ordersCompletedNewUsers,
                (${this.getOrdersCompletedUsers(dateStr)}) as ordersCompletedUsers,
                (${this.getOrdersDiamonds(dateStr)}) as ordersDiamonds,
                (${this.getPurchaseNewUserCount(dateStr)}) as purchaseNewUserCount,
                (${this.getPurchaseDeclinedNewUserCount(dateStr)}) as purchaseDeclinedNewUserCount,
                (${this.getPurchaseNewUserRevenue(dateStr)}) as purchaseNewUserRevenue,
                (${this.getPurchaseFirstTimeUserCount(dateStr)}) as purchaseFirstTimeUserCount,
                (${this.getPurchaseFirstTimeRevenue(dateStr)}) as purchaseFirstTimeRevenue,
                (${this.getPurchaseFirstTimeRevenueInPeriod(dateStr)}) as purchaseFirstTimeRevenueInPeriod,
                (${this.getPurchaseUserCount(dateStr)}) as purchaseUserCount,
                (${this.getPurchaseCount(dateStr)}) as purchaseCount,
                (${this.getPurchaseRevenue(dateStr)}) as purchaseRevenue,
                (${this.getPurchaseDeclinedUserCount(dateStr)}) as purchaseDeclinedUserCount,
                (${this.getPurchaseDeclinedCount(dateStr)}) as purchaseDeclinedCount,
                (${this.getSubscriptionsNew(dateStr)}) as subscriptionsNew,
                (${this.getSubscriptionsRenewed(dateStr)}) as subscriptionsRenewed,
                (${this.getSubscriptionsCancelled(dateStr)}) as subscriptionsCancelled,
                (${this.getSubscriptionsNewRevenue(dateStr)}) as subscriptionsNewRevenue,
                (${this.getSubscriptionsRenewedRevenue(dateStr)}) as subscriptionsRenewedRevenue,
                (${this.getRevenue(dateStr)}) as revenue,
                (${this.getPrizePayoutBase(dateStr)}) as prizePayoutBase,
                (${this.getPrizePayoutDiamonds(dateStr)}) as prizePayoutDiamonds,
                (${this.getJackpotPayout(dateStr)}) as jackpotPayout,
                (${this.getJackpotPayoutCount(dateStr)}) as jackpotPayoutCount
            )
        `;

        const statistics = await connection.manager.query(query);
        statistics[0].date = date;

        await connection.manager.save(StatisticsDailyEntity, statistics[0]);
    }

    private async getCurrentTableDate(): Promise<Date> {
        const connection = await this.db.getConnection();
        const tableDateRow = await connection.manager.query(`SELECT date FROM statistics_daily ORDER BY date DESC LIMIT 1`);
        if (tableDateRow.length === 1 && tableDateRow[0].date)
            return tableDateRow[0].date;
        return new Date('2020-08-10');
    }

    private getNewUserCount(date: string): string {
        return `
            SELECT IFNULL(COUNT(id), 0) as usersNew
            FROM user
            WHERE DATE(createTime) = DATE('${date}')
        `;
    }

    private getTournamentEntries(date: string): string {
        return `
            SELECT IFNULL(COUNT(id), 0) as tournamentEntries
            FROM tournament_entry
            WHERE DATE(createTime) = DATE('${date}')
        `;
    }

    private getTournamentEntriesAllocations(date: string): string {
        return `
            SELECT IFNULL(COUNT(id), 0) as tournamentEntriesAllocations
            FROM tournament_entry_allocation
            WHERE DATE(createTime) = DATE('${date}')
        `;
    }

    private getTournamentEntriesDiamondsSpent(date: string): string {
        return `
            SELECT
                IFNULL(SUM(totalCost), 0) as tournamentEntriesDiamondsSpent
            FROM
                tournament_entry
            WHERE
                DATE(createTime) = DATE('${date}')
            AND
                totalCost > 0
        `;
    }

    private getTournamentEntriesDiamondsRefunded(date: string): string {
        return `
            SELECT
                IFNULL(SUM(totalCost), 0) as tournamentEntriesDiamondsRefunded
            FROM
                tournament_entry
            WHERE
                DATE(refundTime) = DATE('${date}')
            AND
                totalCost > 0
        `;
    }

    private getTournamentNewUsers(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT TE.userId), 0) as tournamentNewUsers
            FROM
                tournament_entry TE
            INNER JOIN
                user U ON U.id = TE.userId
            WHERE
                DATE(TE.createTime) = DATE('${date}')
            AND
                DATE(U.createTime) = Date('${date}')
        `;
    }

    private getTournamentUsers(date: string): string {
        return `
            SELECT IFNULL(COUNT(DISTINCT userId), 0) as tournamentUsers
            FROM tournament_entry
            WHERE DATE(createTime) = DATE('${date}')
        `;
    }

    private getSubscriptionsNew(date: string): string {
        return `
            SELECT IFNULL(COUNT(id), 0) as subscriptionsNew
            FROM subscription
            WHERE DATE(createTime) = DATE('${date}')
        `;
    }

    private getSubscriptionsRenewed(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(*), 0) subscriptionsRenewed
                FROM
                (
                    SELECT
                        SP.subscriptionId,
                        SUM(P.amount) amount,
                        (SELECT
                            COUNT(*) as count
                        FROM
                            subscription_payment SP2
                        INNER JOIN
                            payment P2 ON P2.id = SP2.paymentId AND P2.status = 'Successful' AND DATE(P2.createTime) <= DATE('${date}')
                        WHERE
                            SP2.subscriptionId = SP.subscriptionId) paymentCount
                    FROM
                        payment P
                    INNER JOIN
                        subscription_payment SP ON SP.paymentId = P.id
                    WHERE
                        DATE(P.createTime) = DATE('${date}')
                    AND
                        status = 'Successful'
                    GROUP BY
                        SP.subscriptionId
                ) pc
            WHERE
                pc.paymentCount > 1
        `;
    }

    private getSubscriptionsCancelled(date: string): string {
        return `
            SELECT IFNULL(COUNT(id), 0) as subscriptionsCancelled
            FROM subscription
            WHERE Status = 'Expired'
            AND DATE(cancelledTime) = DATE('${date}')
        `;
    }

    private getPrizePayoutBase(date: string): string {
        return `
            SELECT IFNULL(SUM(baseAmount), 0) as prizePayoutBase
            FROM wallet_transaction
            WHERE purpose = 'Payout'
            AND currencyCode != 'DIA'
            AND baseAmount > 0
            AND DATE(createTime) = DATE('${date}')
        `;
    }

    private getPrizePayoutDiamonds(date: string): string {
        return `
            SELECT
                IFNULL(SUM(amount), 0) as prizePayoutDiamonds
            FROM
                wallet_transaction
            WHERE
                purpose = 'Payout'
            AND
                currencyCode = 'DIA'
            AND
                baseAmount > 0
            AND
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getJackpotPayout(date: string): string {
        return `
            SELECT
                IFNULL(SUM(amount), 0) as jackpotPayout
            FROM
                jackpot_payout
            WHERE
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getJackpotPayoutCount(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(id), 0) as jackpotPayoutCount
            FROM
                jackpot_payout
            WHERE
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getPurchaseRevenue(date: string): string {
        return `
            SELECT
                IFNULL(SUM(amount), 0) as purchaseRevenue
            FROM
                payment
            WHERE
                status = 'Successful'
            AND
                type = 'Purchase'
            AND
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getRevenue(date: string): string {
        return `
            SELECT
                IFNULL(SUM(amount), 0) as revenue
            FROM
                payment
            WHERE
                status = 'Successful'
            AND
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getSubscriptionsNewRevenue(date: string): string {
        return `
            SELECT
                IFNULL(SUM(amount), 0) subscriptionsNewRevenue
                FROM
                (
                    SELECT
                        SP.subscriptionId,
                        SUM(P.amount) amount,
                        (SELECT
                            COUNT(*) as count
                        FROM
                            subscription_payment SP2
                        INNER JOIN
                            payment P2 ON P2.id = SP2.paymentId AND P2.status = 'Successful' AND DATE(P2.createTime) <= DATE('${date}')
                        WHERE
                            SP2.subscriptionId = SP.subscriptionId) paymentCount
                    FROM
                        payment P
                    INNER JOIN
                        subscription_payment SP ON SP.paymentId = P.id
                    WHERE
                        DATE(P.createTime) = DATE('${date}')
                    AND
                        status = 'Successful'
                    GROUP BY
                        SP.subscriptionId
                ) pc
            WHERE
                pc.paymentCount = 1
        `;
    }

    private getSubscriptionsRenewedRevenue(date: string): string {
        return `
            SELECT
                IFNULL(SUM(amount), 0) subscriptionsRenewedRevenue
                FROM
                (
                    SELECT
                        SP.subscriptionId,
                        SUM(P.amount) amount,
                        (SELECT
                            COUNT(*) as count
                        FROM
                            subscription_payment SP2
                        INNER JOIN
                            payment P2 ON P2.id = SP2.paymentId AND P2.status = 'Successful' AND DATE(P2.createTime) <= DATE('${date}')
                        WHERE
                            SP2.subscriptionId = SP.subscriptionId) paymentCount
                    FROM
                        payment P
                    INNER JOIN
                        subscription_payment SP ON SP.paymentId = P.id
                    WHERE
                        DATE(P.createTime) = DATE('${date}')
                    AND
                        status = 'Successful'
                    GROUP BY
                        SP.subscriptionId
                ) pc
            WHERE
                pc.paymentCount > 1
        `;
    }

    private getOrdersCreated(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(id), 0) as ordersCreated
            FROM
                \`order\`
            WHERE
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getOrdersCreatedNewUsers(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) as ordersCreatedNewUsers
            FROM
                \`order\` O
            INNER JOIN
                user U ON U.id = O.userId
            WHERE
                DATE(O.createTime) = DATE('${date}')
            AND
                DATE(U.createTime) = DATE('${date}')
        `;
    }

    private getOrdersCreatedUsers(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) as ordersCreatedUsers
            FROM
                \`order\`
            WHERE
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getOrdersCompleted(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(id), 0) as ordersCompleted
            FROM
                \`order\`
            WHERE
                DATE(completeTime) = DATE('${date}')
        `;
    }

    private getOrdersCompletedNewUsers(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) as ordersCompletedNewUsers
            FROM
                \`order\` O
            INNER JOIN
                user U ON U.id = O.userId
            WHERE
                DATE(O.completeTime) = DATE('${date}')
            AND
                DATE(U.createTime) = DATE('${date}')
        `;
    }

    private getOrdersCompletedUsers(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) as ordersCompletedUsers
            FROM
                \`order\`
            WHERE
                DATE(completeTime) = DATE('${date}')
        `;
    }

    private getOrdersDiamonds(date: string): string {
        return `
            SELECT
                IFNULL(SUM(quantity), 0) as ordersDiamonds
            FROM
                order_item
            WHERE
                DATE(processedTime) = DATE('${date}')
        `;
    }

    private getPurchaseCount(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(id), 0) purchaseCount
            FROM
                payment
            WHERE
                type = 'Purchase'
            AND
                status = 'Successful'
            AND
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getPurchaseUserCount(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) purchaseUserCount
            FROM
                payment
            WHERE
                type = 'Purchase'
            AND
                status = 'Successful'
            AND
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getPurchaseDeclinedCount(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(id), 0) purchaseDeclinedCount
            FROM
                payment
            WHERE
                type = 'Purchase'
            AND
                status = 'Declined'
            AND
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getPurchaseDeclinedUserCount(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) purchaseDeclinedUserCount
            FROM
                payment
            WHERE
                type = 'Purchase'
            AND
                status = 'Declined'
            AND
                DATE(createTime) = DATE('${date}')
        `;
    }

    private getPurchaseNewUserCount(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT P.userId), 0) purchaseNewUserCount
            FROM
                payment P
            INNER JOIN
                user U ON U.id = P.userId
            WHERE
                P.type = 'Purchase'
            AND
                P.status = 'Successful'
            AND
                DATE(P.createTime) = DATE('${date}')
            AND
                DATE(U.createTime) = DATE('${date}')
        `;
    }

    private getPurchaseNewUserRevenue(date: string): string {
        return `
            SELECT
                IFNULL(SUM(P.amount), 0) purchaseNewUserRevenue
            FROM
                payment P
            INNER JOIN
                user U ON U.id = P.userId
            WHERE
                P.type = 'Purchase'
            AND
                P.status = 'Successful'
            AND
                DATE(P.createTime) = DATE('${date}')
            AND
                DATE(U.createTime) = DATE('${date}')
        `;
    }

    private getPurchaseDeclinedNewUserCount(date: string): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT P.userId), 0) purchaseDeclinedNewUserCount
            FROM
                payment P
            INNER JOIN
                user U ON U.id = P.userId
            WHERE
                P.type = 'Purchase'
            AND
                P.status = 'Declined'
            AND
                DATE(P.createTime) = DATE('${date}')
            AND
                DATE(U.createTime) = DATE('${date}')
        `;
    }

    private getPurchaseFirstTimeUserCount(date: string): string {
        return `
            SELECT
                COUNT(DISTINCT(userId)) purchaseFirstTimeUserCount
            FROM
                payment P
            INNER JOIN
                user U ON U.id = P.userId
            INNER JOIN
                (SELECT userId uid, MIN(createTime) firstPurchaseTime FROM payment WHERE type = 'Purchase' AND status = 'Successful' GROUP BY userId HAVING DATE(MIN(createTime)) = DATE('${date}')) FTP ON FTP.uid = P.userId
            WHERE
                P.type = 'Purchase'
            AND
                P.status = 'Successful'
            AND
                DATE(P.createTime) = DATE('${date}')
        `;
    }

    private getPurchaseFirstTimeRevenue(date: string): string {
        return `
            SELECT
                SUM(IFNULL(D.firstPurchaseAmount, 0)) purchaseFirstTimeRevenue
            FROM
                (SELECT
                    FTP.firstPurchaseAmount
                FROM
                    payment P
                INNER JOIN
                    user U ON U.id = P.userId
                INNER JOIN
                    (SELECT userId uid, MIN(createTime) firstPurchaseTime, amount firstPurchaseAmount FROM payment WHERE type = 'Purchase' AND status = 'Successful' GROUP BY userId HAVING DATE(MIN(createTime)) = DATE('${date}')) FTP ON FTP.uid = P.userId
                WHERE
                    P.type = 'Purchase'
                AND
                    P.status = 'Successful'
                AND
                    DATE(P.createTime) = DATE('${date}')
                GROUP BY
                    userId) D
        `;
    }

    private getPurchaseFirstTimeRevenueInPeriod(date: string): string {
        return `
            SELECT
                IFNULL(SUM(P.amount), 0) purchaseFirstTimeRevenueInPeriod
            FROM
                payment P
            INNER JOIN
                user U ON U.id = P.userId
            INNER JOIN
                (SELECT userId uid, MIN(createTime) firstPurchaseTime FROM payment WHERE type = 'Purchase' AND status = 'Successful' GROUP BY userId HAVING DATE(MIN(createTime)) = DATE('${date}')) FTP ON FTP.uid = P.userId
            WHERE
                P.type = 'Purchase'
            AND
                P.status = 'Successful'
            AND
                DATE(P.createTime) = DATE('${date}')
        `;
    }
}

export const generateDailyStatistics = lambdaHandler((event: GenerateEvent) => IocContainer.get(DailyStatisticsHandler).execute(event));