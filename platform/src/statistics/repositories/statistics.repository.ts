import { GlobalDB } from '../../core/db';
import { StatisticsDailyEntity, StatisticsHourlyEntity } from '../entities';
import { Singleton, Inject } from '../../core/ioc';
import { StatisticsFilter } from '../statistics-filter';
import Logger, { LogClass } from '../../core/logging';
import { StatisticsTotals } from '../statistics-totals';
import { NumericTransformer } from '../../core/db/orm';
import { StatisticsIpUserCount } from '../statistics-ip-user-count';
import { StatisticsIpCountryUserCount } from '../statistics-ip-country-user-count';
import { TournamentStatisticsFilter } from '../tournament-statistics-filter';
import { PagedResult } from '../../core';
import { StatisticsTop } from '../statistics-top';
import { UserPaymentStatisticsFilter, UserPaymentProvider, UserPaymentTransaction, UserPaymentTransactionType, UserPaymentTransactionStatus } from '../statistics-user-payment';
import { PaymentMethodType } from '../../payment';
import { StatisticsUserActivity, UserActivityStatisticsFilter } from '../statistics-user-activity';
import { IpUserRegistrationStatisticsFilter, StatisticsIpUserRegistration } from '../statistics-ip-user-registration';
import { StatisticsBigWins } from '../statistics-big-wins';
import { TournamentsByUser } from '../statistics-tournaments-by-user';
import _ from 'lodash';
import moment from 'moment';

@Singleton
@LogClass()
export class StatisticsRepository {
    constructor(
        @Inject private readonly db: GlobalDB) {
    }

    public async getDaily(filter: StatisticsFilter): Promise<StatisticsDailyEntity[]> {
        const connection = await this.db.getConnection();
        let query = connection.createQueryBuilder(StatisticsDailyEntity, 'statistics');
        if (filter) {
            if (filter.from)
                query = query.andWhere('date >= :from', { from: filter.from });

            if (filter.to)
                query = query.andWhere('date <= :to', { to: filter.to });

            if (filter.skip)
                query = query.skip(filter.skip);

            if (filter.take)
                query = query.take(filter.take);

        }

        query = query.orderBy('date', 'DESC');

        return query.getMany();
    }

    public async getHourly(filter: StatisticsFilter): Promise<StatisticsHourlyEntity[]> {
        const connection = await this.db.getConnection();
        let query = connection.createQueryBuilder(StatisticsHourlyEntity, 'statistics');
        if (filter) {
            if (filter.from)
                query = query.andWhere('date >= :from', { from: filter.from });

            if (filter.to)
                query = query.andWhere('date <= :to', { to: filter.to });

            if (filter.skip)
                query = query.skip(filter.skip);

            if (filter.take)
                query = query.take(filter.take);

        }

        query = query.orderBy('date', 'DESC');

        return query.getMany();
    }

    public async getTopWinners(count: number = 100): Promise<StatisticsTop[]> {
        const connection = await this.db.getConnection();
        const query = `
            SELECT
                wallet.userId as userId,
                IFNULL(SUM(wallet_transaction.baseAmount), 0) as winnings,
                'USD' as currencyCode,
                CURRENT_TIMESTAMP as createTime
            FROM
                wallet_transaction
            JOIN
                wallet ON walletId = wallet.id
            JOIN
                user ON wallet.userId = user.id
            WHERE
                user.enabled = 1
            AND
                wallet_transaction.currencyCode != 'DIA'
            AND
                wallet_transaction.baseAmount > 0
            AND
                wallet_transaction.purpose IN('PayOut', 'JackpotPayout')
            GROUP BY
                wallet.userId
            ORDER BY
                SUM(wallet_transaction.baseAmount) DESC
            LIMIT ${count}
        `;

        const results = await connection.query(query);
        const transformer = new NumericTransformer();

        for (const result of results) {
            result.winnings = transformer.from(result.winnings);
            result.createTime = moment(result.createTime).toDate();
        }

        return results;
    }

    public async getTopWinnersDays(days: number = 30, count: number = 100): Promise<StatisticsTop[]> {
        const connection = await this.db.getConnection();
        const query = `
            SELECT
                wallet.userId as userId,
                IFNULL(SUM(wallet_transaction.baseAmount), 0) as winnings,
                'USD' as currencyCode,
                CURRENT_TIMESTAMP as createTime
            FROM
                wallet_transaction
            JOIN
                wallet ON walletId = wallet.id
            JOIN
                user ON wallet.userId = user.id
            WHERE
                user.enabled = 1
            AND
                wallet_transaction.currencyCode != 'DIA'
            AND
                wallet_transaction.baseAmount > 0
            AND
                wallet_transaction.purpose IN('PayOut', 'JackpotPayout')
            AND
                wallet_transaction.createTime BETWEEN NOW() - INTERVAL ${days} DAY AND NOW()
            GROUP BY
                wallet.userId
            ORDER BY
                SUM(wallet_transaction.baseAmount) DESC
            LIMIT ${count}
        `;

        const results = await connection.query(query);
        const transformer = new NumericTransformer();

        for (const result of results) {
            result.winnings = transformer.from(result.winnings);
            result.createTime = moment(result.createTime).toDate();
        }

        return results;
    }

    public async getTotals(): Promise<StatisticsTotals> {
        const connection = await this.db.getConnection();
        const query = `
            SELECT
                *
            FROM
                (SELECT IFNULL(SUM(baseBalance), 0) as liability FROM wallet W INNER JOIN user U ON U.id = W.userId INNER JOIN wallet_account WA ON WA.walletId = W.id WHERE U.type = 'Standard' AND WA.name IN('Withdrawable', 'Escrow')) TL,
                (SELECT IFNULL(SUM(baseBalance), 0) as potentialLiability FROM wallet W INNER JOIN user U ON U.id = W.userId INNER JOIN wallet_account WA ON WA.walletId = W.id WHERE U.type = 'Standard' AND WA.baseBalance >= 100 AND WA.name IN('Withdrawable', 'Escrow')) TPL,
                (SELECT IFNULL(SUM(baseBalance), 0) as pendingWithdrawals FROM wallet W INNER JOIN user U ON U.id = W.userId INNER JOIN wallet_account WA ON WA.walletId = W.id WHERE U.type = 'Standard' AND WA.name = 'Escrow') TPW,
                (SELECT IFNULL(SUM(amount), 0) as completedWithdrawals FROM withdrawal_request WR WHERE WR.status = 'Complete') WRC,
                (SELECT IFNULL(COUNT(id), 0) as totalSignUps FROM user U WHERE U.type = 'Standard') U,
                (SELECT IFNULL(SUM(wallet_transaction.baseAmount), 0) as winnings FROM wallet_transaction JOIN wallet ON walletId = wallet.id JOIN user ON wallet.userId = user.id WHERE wallet_transaction.currencyCode != 'DIA'AND wallet_transaction.baseAmount > 0 AND	wallet_transaction.purpose IN('PayOut', 'JackpotPayout')) W;
            `;

        const results = await connection.query(query);
        const result = results[0];

        const transformer = new NumericTransformer();

        for (const key of Object.keys(result))
            result[key] = transformer.from(result[key]);

        result.createTime = new Date();

        return result;
    }

    public async getUserCountByIp(): Promise<StatisticsIpUserCount[]> {
        const connection = await this.db.getConnection();
        const query = `
            SELECT
                UIP.ipAddress,
                UIP.country,
                UIP.city,
                UIP.region,
                UIP.regionCode,
                UIP.latitude,
                UIP.longitude,
                COUNT(DISTINCT UIP.userId) userCount
            FROM
                user_ip UIP
            INNER JOIN
                user U ON U.id = UIP.userId
            WHERE
                U.type = 'Standard'
            GROUP BY
                ipAddress;
        `;

        const results = await connection.query(query);
        const transformer = new NumericTransformer();

        return results.map((r: any) => {
            if (r.latitude)
                r.latitude = transformer.from(r.latitude);
            if (r.longitude)
                r.longitude = transformer.from(r.longitude);
            if (r.userCount)
                r.userCount = transformer.from(r.userCount);
            return r;
        });
    }

    public async getUserCountByIpCountry(): Promise<StatisticsIpCountryUserCount[]> {
        const connection = await this.db.getConnection();
        const query = `
            SELECT
                UIP.country,
                COUNT(DISTINCT UIP.userId) userCount,
                COUNT(DISTINCT UIP.ipAddress) ipCount
            FROM
                user_ip UIP
            INNER JOIN
                user U ON U.id = UIP.userId
            WHERE
                U.type = 'Standard'
            GROUP BY
                country;
        `;

        const results = await connection.query(query);
        const transformer = new NumericTransformer();

        return results.map((r: any) => {
            if (r.userCount)
                r.userCount = transformer.from(r.userCount);
            if (r.ipCount)
                r.ipCount = transformer.from(r.ipCount);
            return r;
        });
    }

    public async getTournamentReportByUser(filter: TournamentStatisticsFilter): Promise<PagedResult<TournamentsByUser>> {
        const connection = await this.db.getConnection();
        const createdFrom = moment(filter.timeFrom).format('YYYY-MM-DD');
        const createdTo = moment(filter.timeTo).format('YYYY-MM-DD');

        let query = `
            SELECT
                SQL_CALC_FOUND_ROWS
                records.*,
                FOUND_ROWS() AS total
            FROM
                (
                SELECT
                    DATE_FORMAT(E.createTime, '%Y-%m-%d') AS day,
                    T.name,
                    G.name AS gameName,
                    U.id AS userId,
                    U.displayName,
                    U.country,
                    U.regCountry,
                    U.createTime,
                    U.level,
                    COUNT(TEA.id) AS chances,
                    IFNULL(TEP.prizeAmount, 0) prizeAmount,
                    IFNULL(TEP.diamondsWon, 0) diamondsWon
                FROM
                    tournament_entry E
                INNER JOIN
                    tournament T ON E.tournamentId = T.id
                INNER JOIN
                    game G ON T.gameId = G.id
                INNER JOIN
                    tournament_entry_allocation TEA ON E.id = TEA.entryId
                LEFT JOIN
                (
                    SELECT
                        TEP.entryId,
                        SUM(CASE WHEN TEP.currencyCode != 'DIA' THEN TEP.amount ELSE 0 END) AS prizeAmount,
                        SUM(CASE WHEN TEP.currencyCode = 'DIA' THEN TEP.amount ELSE 0 END) AS diamondsWon
                    FROM
                        tournament_entry_prize TEP
                    LEFT JOIN
                        tournament_entry TE ON TE.id = TEP.entryId
                    WHERE
                        TEP.type = 'Cash'
                    AND
                        TE.createTime BETWEEN '${createdFrom}' AND '${createdTo}'
                    GROUP BY
                        TE.id
                ) TEP ON E.id = TEP.entryId
                INNER JOIN
                    user U ON E.userId = U.id
                WHERE
                    E.createTime BETWEEN '${createdFrom}' AND '${createdTo}'`;

        if (filter.gameId)
            query += `
                AND
                    T.gameId = ${filter.gameId} `;

        if (filter.templateId)
            query += `
                AND
                    T.templateId = ${filter.templateId}`;

        if (filter.userId)
            query += `
                AND
                    U.id = ${filter.userId} `;

        if (filter.displayName)
            query += `
                AND
                    U.displayName like '%${filter.displayName}%' `;

        query += `
                GROUP BY
                    YEAR(E.createTime),
                    MONTH(E.createTime),
                    DAY(E.createTime),
                    T.templateId,
                    E.userId
                ORDER BY
                    E.createTime DESC,
                    T.name,
                    U.id`;

        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || 50;
        const skip = (page - 1) * pageSize;

        query += `
                ) AS records
            LIMIT ${pageSize}
            OFFSET ${skip}`;

        Logger.debug(`Query Output: ${query}`);

        let total = 0;
        let items: TournamentsByUser[] = [];

        const results = await connection.query(query);

        if (results && results.length > 0) {
            const transformer = new NumericTransformer();

            total = results[0].total;
            items = results.map((record: any) => {
                return {
                    day: record.day,
                    name: record.name,
                    gameName: record.gameName,
                    userId: transformer.from(record.userId),
                    displayName: record.displayName,
                    country: record.country,
                    regCountry: record.regCountry,
                    createTime: record.createTime,
                    level: transformer.from(record.level),
                    chances: transformer.from(record.chances),
                    prizeAmount: transformer.from(record.prizeAmount),
                    diamondsWon: transformer.from(record.diamondsWon)
                };
            });
        }

        return new PagedResult(items, total, page, pageSize);
    }

    public async getTournamentReportByDay(filter: TournamentStatisticsFilter): Promise<PagedResult<any>> {
        const connection = await this.db.getConnection();

        const params = [];
        const countParams = [];
        let whereClause = 'WHERE t.completeTime is not null';
        let limitClause = '';

        if (filter) {

            if (filter.templateId) {
                whereClause += ` AND t.templateId = ?`;

                params.push(filter.templateId);
            }

            if (filter.gameId) {
                whereClause += ` AND t.gameId = ?`;

                params.push(filter.gameId);
            }

            if (filter.providerId) {
                whereClause += ` AND g.providerId = ?`;

                params.push(filter.providerId);
            }

            if (filter.timeFrom && filter.timeTo) {
                whereClause += ` AND t.createTime BETWEEN ? AND ?`;

                params.push(filter.timeFrom, filter.timeTo);
            }

            countParams.push(...params);

            if (filter.page && filter.pageSize) {

                limitClause = `LIMIT ? OFFSET ?`;
                params.push(filter.pageSize, (filter.page - 1) * filter.pageSize);
            }
        }

        const countQuery = `SELECT COUNT(*) as count from (select t.templateId
            FROM tournament t
            INNER JOIN game g on g.id = t.gameId
            ${whereClause}
            GROUP BY YEAR(t.completeTime), MONTH(t.completeTime), DAY(t.completeTime), t.templateId
            ORDER BY t.completeTime DESC, t.name) t`;

        const resultQuery = `SELECT DATE_FORMAT(t.completeTime, '%Y-%m-%d') as day, t.name, t.templateId, t.gameId, g.name as gameName,
        IFNULL(SUM(allocations.allocationsCount), 0) as playerChances,
        IFNULL(SUM(entries.entriesCount), 0) as playerCount,
        IFNULL(SUM(entries.totalSpent), 0) as totalSpent,
        COUNT(distinct entriesCost.freeEntryCount) as freeEntries,
        COUNT(distinct t.id) tournamentCompletions,
        IFNULL(SUM(prizes.totalPrizeAmount), 0) as totalPrizeAmount
		FROM tournament t
        INNER JOIN game g on g.id = t.gameId

        #entries per tournament
        LEFT JOIN (SELECT COUNT(e.id) as entriesCount, e.tournamentId, sum(e.totalCost) as totalSpent
            FROM tournament_entry e
            GROUP BY e.tournamentId) entries on entries.tournamentId = t.id

        LEFT JOIN (SELECT tec.id as freeEntryCount, tec.tournamentId
            FROM tournament_entry_cost tec
            WHERE tec.amount = 0
            GROUP BY tec.tournamentId) entriesCost on entriesCost.tournamentId = t.id

        #allocations per tournament
        LEFT JOIN (SELECT COUNT(tea.id) as allocationsCount, e.tournamentId
			FROM tournament_entry e
			LEFT JOIN tournament_entry_allocation tea on tea.entryId = e.id
            GROUP BY e.tournamentId) allocations on allocations.tournamentId = t.id

        # sum of prizes awarded per tournament
        LEFT JOIN (SELECT t2.id as tournamentId, t2.templateId, sum(tep.amount) as totalPrizeAmount
			FROM tournament_entry_prize tep
			INNER JOIN tournament_entry e on tep.entryId = e.id
            INNER JOIN tournament t2 on t2.id = e.tournamentId
            GROUP BY t2.id) prizes on prizes.tournamentId = t.id

        ${whereClause}

        GROUP BY YEAR(t.completeTime), MONTH(t.completeTime), DAY(t.completeTime), t.templateId
        ORDER BY day DESC, t.name
        ${limitClause}
        `;

        const [count, results] = await Promise.all([connection.query(countQuery, countParams), connection.query(resultQuery, params)]);

        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || count[0];

        return new PagedResult(results, count[0].count, page, pageSize);
    }

    public async getUserPayments(filter: UserPaymentStatisticsFilter): Promise<PagedResult<UserPaymentTransaction>> {
        const connection = await this.db.getConnection();

        let query = `
            SELECT
                SQL_CALC_FOUND_ROWS
                records.*,
                FOUND_ROWS() as total
            FROM
	            (
                SELECT
                    p.id,
                    p.userId,
                    up.forename,
                    up.surname,
                    up.email,
                    u.displayName,
                    p.type,
                    CASE WHEN p.type = 'Refunded'
                         THEN 'Debit'
                         ELSE 'Credit'
                         END direction,
                    p.amount,
                    p.currencyCode,
                    p.status,
                    p.paymentMethodId,
                    pm.type paymentMethodType,
                    CASE WHEN pm.type = 'CreditCard'
                         THEN CONCAT(pm.cardType, ' ****', pm.lastFour)
                         ELSE NULL
                         END paymentMethodDesc,
                    p.provider,
                    p.providerRef,
                    p.createTime,
                    p.updateTime
                FROM
                    payment p
                INNER JOIN
                    user u ON p.userId = u.id
                INNER JOIN
                    user_profile up ON u.id = up.userId
                INNER JOIN
                    payment_method pm ON p.paymentMethodId = pm.id
                WHERE
                    p.createTime BETWEEN '${filter.createdFrom}' AND '${filter.createdTo}'
            `;

        if (filter.userId)
            query += `AND p.userId = ${filter.userId} `;

        if (filter.displayName)
            query += `AND u.displayName like '%${filter.displayName}%' `;

        if (filter.email)
            query += `AND up.email like '%${filter.email}%' `;

        if (filter.types && filter.types.length > 0)
            query += `AND p.type IN(${filter.types.map((type: UserPaymentTransactionType) => `'${type}'`).join(',')}) `;

        if (filter.providers && filter.providers.length > 0)
            query += `AND p.provider IN(${filter.providers.map((provider: UserPaymentProvider) => `'${provider}'`).join(',')}) `;

        if (filter.statuses && filter.statuses.length > 0)
            query += `AND p.status IN(${filter.statuses.map((status: UserPaymentTransactionStatus) => `'${status}'`).join(',')}) `;

        if (filter.paymentMethodTypes && filter.paymentMethodTypes.length > 0)
            query += `AND pm.type IN(${filter.paymentMethodTypes.map((type: PaymentMethodType) => `'${type}'`).join(',')}) `;

        if (filter.providerRef)
            query += `AND p.providerRef like '%${filter.providerRef}%' `;

        if (!filter.types || filter.types.indexOf(UserPaymentTransactionType.Withdrawal) > -1) {
            query += `
                UNION ALL
                SELECT
                    w.id,
                    w.userId,
                    up.forename,
                    up.surname,
                    up.email,
                    u.displayName,
                    'Withdrawal',
                    'Debit',
                    w.amount,
                    w.currencyCode,
                    w.status,
                    NULL paymentMethodId,
                    NULL paymentMethodType,
                    NULL paymentMethodDesc,
                    w.provider,
                    w.providerRef,
                    w.createTime,
                    w.updateTime
                FROM
                    withdrawal_request w
                INNER JOIN
                    user u ON w.userId = u.id
                INNER JOIN
                    user_profile up ON u.id = up.userId
                WHERE
                    w.createTime BETWEEN '${filter.createdFrom}' AND '${filter.createdTo}'
            `;

            if (filter.userId)
                query += `AND w.userId = ${filter.userId} `;

            if (filter.displayName)
                query += `AND u.displayName like '%${filter.displayName}%' `;

            if (filter.email)
                query += `AND up.email like '%${filter.email}%' `;

            if (filter.paymentMethodTypes && filter.paymentMethodTypes.length > 0)
                query += `AND w.provider IN(${filter.paymentMethodTypes.map((type: PaymentMethodType) => `'${type}'`).join(',')}) `;

            if (filter.providers && filter.providers.length > 0)
                query += `AND w.provider IN(${filter.providers.map((provider: UserPaymentProvider) => `'${provider}'`).join(',')}) `;

            if (filter.statuses && filter.statuses.length > 0)
                query += `AND w.status IN(${filter.statuses.map((status: UserPaymentTransactionStatus) => `'${status}'`).join(',')}) `;

            if (filter.providerRef)
                query += `AND w.providerRef like '%${filter.providerRef}%' `;
        }

        const page = filter?.page || 1;
        const pageSize = filter?.pageSize || 50;
        const skip = (page - 1) * pageSize;

        let order = 'createTime';
        let orderDirection: any = 'DESC';

        if (filter.order) {
            order = Object.keys(filter.order)[0];
            orderDirection = Object.values(filter.order)[0];
        }

        query += `) AS records
                ORDER BY ${order} ${orderDirection}
                LIMIT ${pageSize}
                OFFSET ${skip}`;

        let total = 0;
        let items: UserPaymentTransaction[] = [];

        const results = await connection.query(query);

        if (results && results.length > 0) {
            const transformer = new NumericTransformer();

            total = results[0].total;
            items = results.map((record: any) => {
                return {
                    id: record.id,
                    userId: record.userId,
                    displayName: record.displayName,
                    forename: record.forename,
                    surname: record.surname,
                    email: record.email,
                    type: record.type,
                    direction: record.direction,
                    amount: transformer.from(record.amount),
                    currencyCode: record.currencyCode,
                    status: record.status,
                    paymentMethodId: record.paymentMethodId,
                    paymentMethodType: record.paymentMethodType,
                    paymentMethodDesc: record.paymentMethodDesc,
                    provider: record.provider,
                    providerRef: record.providerRef,
                    createTime: record.createTime,
                    updateTime: record.updateTime
                };
            });
        }

        return new PagedResult(items, total, page, pageSize);
    }

    public async getUserActivity(filter: UserActivityStatisticsFilter): Promise<PagedResult<StatisticsUserActivity>> {
        const connection = await this.db.getConnection();

        let query = `
            SELECT
                SQL_CALC_FOUND_ROWS
                items.*,
                FOUND_ROWS() as total
            FROM
                (
                    SELECT
                        U.id,
                        U.displayName,
                        UP.email,
                        IFNULL(P.purchaseCount, 0) purchaseCount,
                        IFNULL(P.purchaseAmount, 0) purchaseAmount,
                        IFNULL(WR.withdrawalRequestCount, 0) withdrawalRequestCount,
                        IFNULL(WR.withdrawalRequestAmount, 0) withdrawalRequestAmount,
                        IFNULL(WRC.withdrawalCompleteCount, 0) withdrawalCompleteCount,
                        IFNULL(WRC.withdrawalCompleteAmount, 0) withdrawalCompleteAmount,
                        IFNULL(TEP.prizeCount, 0) prizeCount,
                        IFNULL(TEP.prizeAmount, 0) prizeAmount,
                        IFNULL(TEP.diamondsWon, 0) diamondsWon,
                        IFNULL(O.diamondsPurchased, 0) diamondsPurchased,
                        IFNULL(TE.diamondsSpent, 0) diamondsSpent,
                        IFNULL(TE.freePlays, 0) freePlays
                    FROM
                        user U
                    LEFT JOIN
                        user_profile UP ON UP.userId = U.id
                    LEFT JOIN
                    (
                        SELECT
                            U.id AS userId,
                            TEP.currencyCode AS currencyCode,
                            COUNT(TEP.id) AS prizeCount,
                            SUM(CASE WHEN TEP.currencyCode != 'DIA' THEN TEP.amount ELSE 0 END) AS prizeAmount,
                            SUM(CASE WHEN TEP.currencyCode = 'DIA' THEN TEP.amount ELSE 0 END) AS diamondsWon
                        FROM
                            tournament_entry_prize TEP
                        LEFT JOIN
                            tournament_entry TE ON TE.id = TEP.entryId
                        INNER JOIN
                            user U ON U.id = TE.userId
                        WHERE
                            TEP.type = 'Cash'
                        AND
                            TEP.createTime >= '${filter.createdFrom}' AND TEP.createTime <= '${filter.createdTo}'
                        GROUP BY
                            TE.userId
                    )
                    TEP ON U.id = TEP.userId
                    LEFT JOIN
                    (
                        SELECT
                            U.id AS userId,
                            COUNT(P.id) purchaseCount,
                            SUM(P.amount) purchaseAmount
                        FROM
                            payment P
                        INNER JOIN
                            user U ON U.id = P.userId
                        WHERE
                            P.type = 'Purchase'
                        AND
                            P.status = 'Successful'
                        AND
                            P.createTime >= '${filter.createdFrom}' AND P.createTime <= '${filter.createdTo}'
                        GROUP BY
                            P.userId
                    )
                    P ON U.id = P.userId
                    LEFT JOIN
                    (
                        SELECT
                            U.id AS userId,
                            SUM(TE.totalCost) AS diamondsSpent,
                            SUM(CASE WHEN TE.totalCost = 0 THEN 1 ELSE 0 END) AS freePlays
                        FROM
                            tournament_entry TE
                        FORCE
                            INDEX (IDX_08cdb38c058a9131b4157d9d03)
                        INNER JOIN
                            user U ON U.id = TE.userId
                        WHERE
                            TE.createTime >= '${filter.createdFrom}' AND TE.createTime <= '${filter.createdTo}'
                        GROUP BY
                            TE.userId
                    )
                    TE ON U.id = TE.userId
                    LEFT JOIN
                    (
                        SELECT
                            U.id AS userId,
                            COUNT(WR.id) AS withdrawalRequestCount,
                            SUM(WR.amount) AS withdrawalRequestAmount
                        FROM
                            withdrawal_request WR
                        INNER JOIN
                            user U ON U.id = WR.userId
                        WHERE
                            WR.status != 'Complete'
                        AND
                            WR.createTime >= '${filter.createdFrom}' AND WR.createTime <= '${filter.createdTo}'
                        GROUP BY
                            WR.userId
                    )
                    WR ON U.id = WR.userId
                    LEFT JOIN
                    (
                        SELECT
                            U.id AS userId,
                            COUNT(WR.id) AS withdrawalCompleteCount,
                            SUM(WR.amount) AS withdrawalCompleteAmount
                        FROM
                            withdrawal_request WR
                        INNER JOIN
                            user U ON U.id = WR.userId
                        WHERE
                            WR.status = 'Complete'
                        AND
                            WR.completionTime >= '${filter.createdFrom}' AND WR.completionTime <= '${filter.createdTo}'
                        GROUP BY
                            WR.userId
                    )
                    WRC ON U.id = WRC.userId
                    LEFT JOIN
                    (
                        SELECT
                            U.id AS userId,
                            SUM(OI.quantity) AS diamondsPurchased
                        FROM
                            \`order\` O
                        LEFT JOIN
                            order_item OI ON OI.orderId = O.id
                        INNER JOIN
                            user U ON U.id = O.userId
                        WHERE
                            O.status = 'Complete'
                        AND
                            O.createTime >= '${filter.createdFrom}' AND O.createTime <= '${filter.createdTo}'
                        GROUP BY
                            O.userId
                    )
                    O ON U.id = O.userId
                    WHERE
                        (purchaseCount > 0
                    OR
                        withdrawalRequestCount > 0
                    OR
                        withdrawalCompleteCount > 0
                    OR
                        prizeCount > 0
                    OR
                        diamondsPurchased > 0
                    OR
                        diamondsWon > 0
                    OR
                        diamondsSpent > 0
                    OR
                        freePlays > 0)
            `;

        if (filter.userId)
            query += `AND U.id = ${filter.userId} `;

        if (filter.displayName)
            query += `AND U.displayName like '%${filter.displayName}%' `;

        query += `) AS items `;

        let order = 'id';
        let orderDirection: any = 'ASC';

        if (filter.order) {
            order = Object.keys(filter.order)[0];
            orderDirection = Object.values(filter.order)[0];
        }

        query += `ORDER BY ${order} ${orderDirection} `;

        const pageSize = filter?.pageSize;
        let page = 1;
        let skip = 0;

        if (pageSize) {
            page = filter?.page || 1;
            skip = (page - 1) * pageSize;
        }

        if (pageSize)
            query += `LIMIT ${pageSize} OFFSET ${skip}`;

        let total = 0;
        let items: StatisticsUserActivity[] = [];

        const results = await connection.query(query);

        if (results && results.length > 0) {
            const transformer = new NumericTransformer();

            total = results[0].total;
            items = results.map((record: any) => {
                return {
                    id: record.id,
                    displayName: record.displayName,
                    email: record.email,
                    purchaseCount: transformer.from(record.purchaseCount),
                    purchaseAmount: transformer.from(record.purchaseAmount),
                    withdrawalRequestCount: transformer.from(record.withdrawalRequestCount),
                    withdrawalRequestAmount: transformer.from(record.withdrawalRequestAmount),
                    withdrawalCompleteCount: transformer.from(record.withdrawalCompleteCount),
                    withdrawalCompleteAmount: transformer.from(record.withdrawalCompleteAmount),
                    prizeCount: transformer.from(record.prizeCount),
                    prizeAmount: transformer.from(record.prizeAmount),
                    diamondsWon: transformer.from(record.diamondsWon),
                    diamondsPurchased: transformer.from(record.diamondsPurchased),
                    diamondsSpent: transformer.from(record.diamondsSpent),
                    freePlays: transformer.from(record.freePlays)
                };
            });
        }

        return new PagedResult(items, total, page, pageSize ?? total);
    }

    public async getUserRegistrationsByIp(filter: IpUserRegistrationStatisticsFilter): Promise<StatisticsIpUserRegistration[]> {
        const connection = await this.db.getConnection();
        const query = `
            SELECT
                U.regCountry country,
                U.regState state,
                COUNT(DISTINCT U.id) userCount,
                SUM(CASE WHEN P.purchaseCount > 0 THEN 1 ELSE 0 END) convertedCount,
                COUNT(DISTINCT U.ipAddress) ipCount
            FROM
                user U
            LEFT JOIN
                (
                    SELECT
                        U.id AS userId,
                        COUNT(P.id) purchaseCount
                    FROM
                        payment P
                    INNER JOIN
                        user U ON U.id = P.userId
                    WHERE
                        P.status = 'Successful'
                    AND
                        DATE(P.createTime) >= DATE('${filter.createdFrom}')
                    AND
                        DATE(P.createTime) <= DATE('${filter.createdTo}')
                    GROUP BY
                        P.userId
                )
            P ON U.id = P.userId
            WHERE
                DATE(U.createTime) >= DATE('${filter.createdFrom}')
            AND
                DATE(U.createTime) <= DATE('${filter.createdTo}')
            GROUP BY
                U.regCountry,
                U.regState
            ORDER BY
                userCount DESC
            `;

        const results = await connection.query(query);
        const transformer = new NumericTransformer();

        return results.map((r: any) => {
            if (r.userCount)
                r.userCount = transformer.from(r.userCount);
            if (r.convertedCount)
                r.convertedCount = transformer.from(r.convertedCount);
            if (r.ipCount)
                r.ipCount = transformer.from(r.ipCount);
            return r;
        });
    }

    public async getBigWins(count: number = 30): Promise<StatisticsBigWins[]> {
        const connection = await this.db.getConnection();

        const queryTournamentWinners = `
        SELECT
            *
        FROM (
            SELECT
                JP.userId,
                J.name,
                J.id AS id,
                'Jackpot' type,
                JP.amount,
                JP.createTime AS date
            FROM
                jackpot_payout JP
            INNER JOIN
                jackpot J ON J.id = JP.jackpotId
            INNER JOIN
                user U ON U.id = JP.userId
            WHERE
                JP.amount > 1000
            AND
                U.type != 'Internal'
            UNION ALL
            SELECT
                TE.userId,
                T.name,
                T.id AS id,
                'Tournament' type,
                SUM(TEP.amount) AS amount,
                MAX(TEP.createTime) AS date
            FROM
                tournament_entry_prize TEP
            INNER JOIN
                tournament_entry TE ON TE.id = TEP.entryId
            INNER JOIN
                tournament T ON T.id = TE.tournamentId
            INNER JOIN
                user U ON U.id = TE.userId
            WHERE
                TEP.type = 'Cash'
            AND
                TEP.amount > 1000
            AND
                U.type != 'Internal'
            GROUP BY
                TE.userId,
                TE.tournamentId)
            winners
        ORDER BY
            amount DESC,
            date DESC
        LIMIT ${count};
        `;

        return connection.query(queryTournamentWinners);
    }
}