import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { GlobalDB } from '@tcom/platform/lib/core/db';
import { StatisticsHourlyEntity } from '@tcom/platform/lib/statistics/entities';

@Singleton
@LogClass()
class HourlyStatisticsHandler {
    constructor(@Inject private readonly db: GlobalDB) {
    }

    public async execute(): Promise<void> {
        const tableDate = await this.getCurrentTableDate();
        const currentDate = new Date();
        currentDate.setUTCHours(currentDate.getUTCHours() - 1);

        while (tableDate < currentDate) {
            await this.getStatistics(tableDate);
            tableDate.setUTCHours(tableDate.getUTCHours() + 1);
        }
    }

    private async getStatistics(date: Date) {
        const connection = await this.db.getConnection();

        const dateStr = date.toISOString().split('T')[0];
        const hour = date.getUTCHours();
        Logger.info(`Processing Hourly Statistics ${dateStr} ${hour}:00`);

        const query = `
            SELECT * FROM
            (
                (${this.getNewUserCount(dateStr, hour)}) as usersNew,
                (${this.getTournamentNewUsers(dateStr, hour)}) as tournamentUsersNew,
                (${this.getTournamentUsers(dateStr, hour)}) as tournamentUsers,
                (${this.getTournamentEntries(dateStr, hour)}) as tournamentEntries,
                (${this.getTournamentEntriesAllocations(dateStr, hour)}) as tournamentEntriesAllocations,
                (${this.getTournamentEntriesDiamondsSpent(dateStr, hour)}) as tournamentEntriesDiamondsSpent,
                (${this.getTournamentEntriesDiamondsRefunded(dateStr, hour)}) as tournamentEntriesDiamondsRefunded,
                (${this.getOrdersCreated(dateStr, hour)}) as ordersCreated,
                (${this.getOrdersCreatedNewUsers(dateStr, hour)}) as ordersCreatedNewUsers,
                (${this.getOrdersCreatedUsers(dateStr, hour)}) as ordersCreatedUsers,
                (${this.getOrdersCompleted(dateStr, hour)}) as ordersCompleted,
                (${this.getOrdersCompletedNewUsers(dateStr, hour)}) as ordersCompletedNewUsers,
                (${this.getOrdersCompletedUsers(dateStr, hour)}) as ordersCompletedUsers,
                (${this.getOrdersDiamonds(dateStr, hour)}) as ordersDiamonds,
                (${this.getPurchaseNewUserCount(dateStr, hour)}) as purchaseNewUserCount,
                (${this.getPurchaseDeclinedNewUserCount(dateStr, hour)}) as purchaseDeclinedNewUserCount,
                (${this.getPurchaseNewUserRevenue(dateStr, hour)}) as purchaseNewUserRevenue,
                (${this.getPurchaseFirstTimeUserCount(dateStr, hour)}) as purchaseFirstTimeUserCount,
                (${this.getPurchaseFirstTimeRevenue(dateStr, hour)}) as purchaseFirstTimeRevenue,
                (${this.getPurchaseFirstTimeRevenueInPeriod(dateStr, hour)}) as purchaseFirstTimeRevenueInPeriod,
                (${this.getPurchaseUserCount(dateStr, hour)}) as purchaseUserCount,
                (${this.getPurchaseCount(dateStr, hour)}) as purchaseCount,
                (${this.getPurchaseRevenue(dateStr, hour)}) as purchaseRevenue,
                (${this.getPurchaseDeclinedUserCount(dateStr, hour)}) as purchaseDeclinedUserCount,
                (${this.getPurchaseDeclinedCount(dateStr, hour)}) as purchaseDeclinedCount,
                (${this.getSubscriptionsNew(dateStr, hour)}) as subscriptionsNew,
                (${this.getSubscriptionsRenewed(dateStr, hour)}) as subscriptionsRenewed,
                (${this.getSubscriptionsCancelled(dateStr, hour)}) as subscriptionsCancelled,
                (${this.getSubscriptionsNewRevenue(dateStr, hour)}) as subscriptionsNewRevenue,
                (${this.getSubscriptionsRenewedRevenue(dateStr, hour)}) as subscriptionsRenewedRevenue,
                (${this.getRevenue(dateStr, hour)}) as revenue,
                (${this.getPrizePayoutBase(dateStr, hour)}) as prizePayoutBase,
                (${this.getPrizePayoutDiamonds(dateStr, hour)}) as prizePayoutDiamonds,
                (${this.getJackpotPayout(dateStr, hour)}) as jackpotPayout,
                (${this.getJackpotPayoutCount(dateStr, hour)}) as jackpotPayoutCount
            )
        `;

        const statistics = await connection.manager.query(query);
        statistics[0].date = date;

        await connection.manager.insert(StatisticsHourlyEntity, statistics[0]);
    }

    private async getCurrentTableDate(): Promise<Date> {
        const connection = await this.db.getConnection();
        const tableDateRow = await connection.manager.query(`SELECT date FROM statistics_hourly ORDER BY date DESC LIMIT 1`);
        if (tableDateRow.length === 1 && tableDateRow[0].date) {
            tableDateRow[0].date.setUTCHours(tableDateRow[0].date.getUTCHours() + 1);
            return tableDateRow[0].date;
        }
        return new Date('2020-08-10');
    }

    private getNewUserCount(date: string, hour: number): string {
        return `
            SELECT IFNULL(COUNT(id), 0) as usersNew
            FROM user
            WHERE DATE(createTime) = DATE('${date}') AND HOUR(createTime) = ${hour}
        `;
    }

    private getTournamentEntries(date: string, hour: number): string {
        return `
            SELECT IFNULL(COUNT(id), 0) as tournamentEntries
            FROM tournament_entry
            WHERE DATE(createTime) = DATE('${date}') AND HOUR(createTime) = ${hour}
        `;
    }

    private getTournamentEntriesAllocations(date: string, hour: number): string {
        return `
            SELECT IFNULL(COUNT(id), 0) as tournamentEntriesAllocations
            FROM tournament_entry_allocation
            WHERE DATE(createTime) = DATE('${date}') AND HOUR(createTime) = ${hour}
        `;
    }

    private getTournamentEntriesDiamondsSpent(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(SUM(totalCost), 0) as tournamentEntriesDiamondsSpent
            FROM
                tournament_entry
            WHERE
                DATE(createTime) = DATE('${date}')
            AND
                HOUR(createTime) = ${hour}
            AND
                totalCost > 0
        `;
    }

    private getTournamentEntriesDiamondsRefunded(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(SUM(totalCost), 0) as tournamentEntriesDiamondsRefunded
            FROM
                tournament_entry
            WHERE
                DATE(refundTime) = DATE('${date}')
            AND
                HOUR(refundTime) = ${hour}
            AND
                totalCost > 0
        `;
    }

    private getTournamentNewUsers(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT TE.userId), 0) as tournamentUsersNew
            FROM
                tournament_entry TE
            INNER JOIN
                user U ON U.id = TE.userId
            WHERE
                (DATE(TE.createTime) = DATE('${date}') AND HOUR(TE.createTime) = ${hour})
            AND
                (DATE(U.createTime) = Date('${date}') AND HOUR(TE.createTime) = ${hour})
        `;
    }

    private getTournamentUsers(date: string, hour: number): string {
        return `
            SELECT IFNULL(COUNT(DISTINCT userId), 0) as tournamentUsers
            FROM tournament_entry WHERE DATE(createTime) = DATE('${date}') AND HOUR(createTime) = ${hour}
        `;
    }

    private getSubscriptionsNew(date: string, hour: number): string {
        return `
            SELECT IFNULL(COUNT(id), 0) as subscriptionsNew
            FROM subscription
            WHERE DATE(createTime) = DATE('${date}')
            AND HOUR(createTime) = ${hour}
        `;
    }

    private getSubscriptionsRenewed(date: string, hour: number): string {
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
                            payment P2 ON P2.id = SP2.paymentId AND P2.status = 'Successful' AND P2.createTime <= '${date} ${hour + 1}:00'
                        WHERE
                            SP2.subscriptionId = SP.subscriptionId) paymentCount
                    FROM
                        payment P
                    INNER JOIN
                        subscription_payment SP ON SP.paymentId = P.id
                    WHERE
                        DATE(P.createTime) = DATE('${date}')
                    AND
                        HOUR(P.createTime) = ${hour}
                    AND
                        status = 'Successful'
                    GROUP BY
                        SP.subscriptionId
                ) pc
            WHERE
                pc.paymentCount > 1
        `;
    }

    private getSubscriptionsCancelled(date: string, hour: number): string {
        return `
            SELECT IFNULL(COUNT(id), 0) as subscriptionsCancelled
            FROM subscription
            WHERE Status = 'Expired'
            AND DATE(cancelledTime) = DATE('${date}')
            AND HOUR(cancelledTime) = ${hour}
        `;
    }

    private getPrizePayoutBase(date: string, hour: number): string {
        return `
            SELECT IFNULL(SUM(baseAmount), 0) as prizePayoutBase
            FROM wallet_transaction
            WHERE purpose = 'Payout'
            AND currencyCode != 'DIA'
            AND baseAmount > 0
            AND DATE(createTime) = DATE('${date}')
            AND HOUR(createTime) = ${hour}
        `;
    }

    private getPrizePayoutDiamonds(date: string, hour: number): string {
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
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getJackpotPayout(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(SUM(amount), 0) as jackpotPayout
            FROM
                jackpot_payout
            WHERE
                DATE(createTime) = DATE('${date}')
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getJackpotPayoutCount(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(COUNT(id), 0) as jackpotPayoutCount
            FROM
                jackpot_payout
            WHERE
                DATE(createTime) = DATE('${date}')
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getPurchaseRevenue(date: string, hour: number): string {
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
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getRevenue(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(SUM(amount), 0) as revenue
            FROM
                payment
            WHERE
                status = 'Successful'
            AND
                DATE(createTime) = DATE('${date}')
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getSubscriptionsNewRevenue(date: string, hour: number): string {
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
                            payment P2 ON P2.id = SP2.paymentId AND P2.status = 'Successful' AND P2.createTime <= '${date} ${hour + 1}:00'
                        WHERE
                            SP2.subscriptionId = SP.subscriptionId) paymentCount
                    FROM
                        payment P
                    INNER JOIN
                        subscription_payment SP ON SP.paymentId = P.id
                    WHERE
                        DATE(P.createTime) = DATE('${date}')
                    AND
                        HOUR(P.createTime) = ${hour}
                    AND
                        status = 'Successful'
                    GROUP BY
                        SP.subscriptionId
                ) pc
            WHERE
                pc.paymentCount = 1
        `;
    }

    private getSubscriptionsRenewedRevenue(date: string, hour: number): string {
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
                            payment P2 ON P2.id = SP2.paymentId AND P2.status = 'Successful' AND P2.createTime <= '${date} ${hour + 1}:00'
                        WHERE
                            SP2.subscriptionId = SP.subscriptionId) paymentCount
                    FROM
                        payment P
                    INNER JOIN
                        subscription_payment SP ON SP.paymentId = P.id
                    WHERE
                        DATE(P.createTime) = DATE('${date}')
                    AND
                        HOUR(P.createTime) = ${hour}
                    AND
                        status = 'Successful'
                    GROUP BY
                        SP.subscriptionId
                ) pc
            WHERE
                pc.paymentCount > 1
        `;
    }

    private getOrdersCreated(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(COUNT(id), 0) as ordersCreated
            FROM
                \`order\`
            WHERE
                DATE(createTime) = DATE('${date}')
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getOrdersCreatedNewUsers(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) as ordersCreatedNewUsers
            FROM
                \`order\` O
            INNER JOIN
                user U ON U.id = O.userId
            WHERE
                (DATE(O.createTime) = DATE('${date}') AND HOUR(O.createTime) = ${hour})
            AND
                (DATE(U.createTime) = DATE('${date}') AND HOUR(U.createTime) = ${hour})
        `;
    }

    private getOrdersCreatedUsers(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) as ordersCreatedUsers
            FROM
                \`order\`
            WHERE
                DATE(createTime) = DATE('${date}')
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getOrdersCompleted(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(COUNT(id), 0) as ordersCompleted
            FROM
                \`order\`
            WHERE
                DATE(completeTime) = DATE('${date}')
            AND
                HOUR(completeTime) = ${hour}
        `;
    }

    private getOrdersCompletedNewUsers(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) as ordersCompletedNewUsers
            FROM
                \`order\` O
            INNER JOIN
                user U ON U.id = O.userId
                WHERE
                (DATE(O.completeTime) = DATE('${date}') AND HOUR(O.createTime) = ${hour})
            AND
                (DATE(U.createTime) = DATE('${date}') AND HOUR(U.createTime) = ${hour})
        `;
    }

    private getOrdersCompletedUsers(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) as ordersCompletedUsers
            FROM
                \`order\`
            WHERE
                DATE(completeTime) = DATE('${date}')
            AND
                HOUR(completeTime) = ${hour}
        `;
    }

    private getOrdersDiamonds(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(SUM(quantity), 0) as ordersDiamonds
            FROM
                order_item
            WHERE
                DATE(processedTime) = DATE('${date}')
            AND
                HOUR(processedTime) = ${hour}
        `;
    }

    private getPurchaseCount(date: string, hour: number): string {
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
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getPurchaseUserCount(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT userId), 0) purchaseUserCount
            FROM
                payment
            WHERE
                type IN ('Purchase', 'Subscription')
            AND
                status = 'Successful'
            AND
                DATE(createTime) = DATE('${date}')
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getPurchaseDeclinedCount(date: string, hour: number): string {
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
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getPurchaseDeclinedUserCount(date: string, hour: number): string {
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
            AND
                HOUR(createTime) = ${hour}
        `;
    }

    private getPurchaseNewUserCount(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(COUNT(DISTINCT P.userId), 0) purchaseNewUserCount
            FROM
                payment P
            INNER JOIN
                user U ON U.id = P.userId
            WHERE
                P.type IN ('Purchase', 'Subscription')
            AND
                P.status = 'Successful'
            AND
                (DATE(P.createTime) = DATE('${date}') AND HOUR(P.createTime) = ${hour})
            AND
                DATE(U.createTime) = DATE('${date}')
        `;
    }

    private getPurchaseDeclinedNewUserCount(date: string, hour: number): string {
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
                (DATE(P.createTime) = DATE('${date}') AND HOUR(P.createTime) = ${hour})
            AND
                (DATE(U.createTime) = DATE('${date}') AND HOUR(U.createTime) = ${hour})
        `;
    }

    private getPurchaseNewUserRevenue(date: string, hour: number): string {
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
                (DATE(P.createTime) = DATE('${date}') AND HOUR(P.createTime) = ${hour})
            AND
                DATE(U.createTime) = DATE('${date}')
        `;
    }

    private getPurchaseFirstTimeUserCount(date: string, hour: number): string {
        return `
            SELECT
                COUNT(DISTINCT(P.userId)) purchaseFirstTimeUserCount
            FROM
                payment P
            INNER JOIN
                user U ON U.id = P.userId
            INNER JOIN
                (SELECT userId uid, MIN(createTime) firstPurchaseTime FROM payment WHERE type = 'Purchase' AND status = 'Successful' GROUP BY userId HAVING DATE(MIN(createTime)) = DATE('${date}') AND HOUR(MIN(createTime)) = ${hour}) FTP ON FTP.uid = P.userId
            WHERE
                P.type = 'Purchase'
            AND
                P.status = 'Successful'
            AND
                DATE(P.createTime) = DATE('${date}')
            AND
                HOUR(P.createTime) = ${hour}
        `;
    }

    private getPurchaseFirstTimeRevenue(date: string, hour: number): string {
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
                    (SELECT userId uid, MIN(createTime) firstPurchaseTime, amount firstPurchaseAmount FROM payment WHERE type = 'Purchase' AND status = 'Successful' GROUP BY userId HAVING DATE(MIN(createTime)) = DATE('${date}' AND HOUR(MIN(createTime)) = ${hour})) FTP ON FTP.uid = P.userId
                WHERE
                    P.type = 'Purchase'
                AND
                    P.status = 'Successful'
                AND
                    DATE(P.createTime) = DATE('${date}')
                AND
                    HOUR(P.createTime) = ${hour}
                GROUP BY
                    userId) D
        `;
    }

    private getPurchaseFirstTimeRevenueInPeriod(date: string, hour: number): string {
        return `
            SELECT
                IFNULL(SUM(P.amount), 0) purchaseFirstTimeRevenueInPeriod
            FROM
                payment P
            INNER JOIN
                user U ON U.id = P.userId
            INNER JOIN
                (SELECT userId uid, MIN(createTime) firstPurchaseTime FROM payment WHERE type = 'Purchase' AND status = 'Successful' GROUP BY userId HAVING DATE(MIN(createTime)) = DATE('${date}') AND HOUR(MIN(createTime)) = ${hour}) FTP ON FTP.uid = P.userId
            WHERE
                P.type = 'Purchase'
            AND
                P.status = 'Successful'
            AND
                DATE(P.createTime) = DATE('${date}')
            AND
                HOUR(P.createTime) = ${hour}
        `;
    }
}

export const generateHourlyStatistics = lambdaHandler(() => IocContainer.get(HourlyStatisticsHandler).execute());