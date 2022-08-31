import {MigrationInterface, QueryRunner} from "typeorm";

export class StatisticsHourlyEvent1612195950382 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query('DROP EVENT IF EXISTS statistics_hourly');
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        const query = `
            CREATE EVENT statistics_hourly
            ON SCHEDULE EVERY 15 MINUTE STARTS DATE_FORMAT(CURRENT_TIMESTAMP, "%y-%m-%d %H:00:00")
            DO
            BEGIN
                SET @LastDate = IFNULL((SELECT MAX(date) FROM statistics_hourly), '2020-08-11 00:00:00');
                SET @StartDate = DATE_ADD(DATE_FORMAT(@LastDate, "%y-%m-%d %H:00:00"), INTERVAL -1 HOUR);
                SET @MaxDate =  DATE_ADD(DATE_FORMAT(NOW(), "%y-%m-%d %H:00:00"), INTERVAL 1 HOUR);
                
                INSERT INTO statistics_hourly
                    (
                        date, 
                        usersNew, 
                        tournamentEntries, 
                        tournamentUsers, 
                        tournamentAvgPlayedFree, 
                        tournamentAvgPlayedVip, 
                        userAvgTournamentPreVip, 
                        subscriptionsNew, 
                        subscriptionsRenewed, 
                        userAvgSubscribeTime, 
                        prizePayoutBase, 
                        revenue
                    )
                    SELECT
                        DATE_FORMAT(cal.date, "%y-%m-%d %H:00:00") as date,
                        IFNULL(U.count, 0) as usersNew,
                        IFNULL(T.count, 0) as tournamentEntries,
                        IFNULL(T.userCount, 0) as tournamentUsers,
                        IFNULL(T2.avg, 0) as tournamentAvgPlayedFree,
                        IFNULL(T3.avg, 0) as tournamentAvgPlayedVip,
                        IFNULL(T4.avg, 0) as userAvgTournamentPreVip,
                        IFNULL(S.count, 0) as subscriptionsNew,
                        0 as subscriptionsRenewed,
                        IFNULL(SR.avg, 0) as userAvgSubscribeTime,
                        IFNULL(P.total, 0) as prizePayoutBase,
                        IFNULL(R.revenue, 0) as revenue
                    FROM
                        (
                            SELECT SUBDATE(@MaxDate, INTERVAL (TIMESTAMPDIFF(HOUR, @StartDate, @MaxDate)) HOUR) + INTERVAL xc HOUR AS date
                            FROM (
                                SELECT @xi:=@xi+1 as xc from
                                (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc1,
                                (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc2,
                                (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc3,
                                (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc4,
                                (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc5,
                                (SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4) xc6,
                                (SELECT @xi:=-1) xc0
                            ) xxc1
                        ) cal
                    LEFT JOIN
                        (SELECT createTime, COUNT(id) as count FROM user GROUP BY DATE(createTime), HOUR(createTime)) AS U ON DATE(U.createTime) = DATE(cal.date) AND HOUR(U.createTime) = HOUR(cal.date)
                    LEFT JOIN
                        (SELECT createTime, COUNT(id) as count FROM subscription GROUP BY DATE(createTime), HOUR(createTime)) AS S ON DATE(S.createTime) = DATE(cal.date) AND HOUR(S.createTime) = HOUR(cal.date)
                    LEFT JOIN
                        (SELECT subscription.createTime, AVG(TIME_TO_SEC(TIMEDIFF(user.createTime, subscription.createTime))) as avg FROM subscription JOIN user ON user.id = userId GROUP BY DATE(subscription.createTime), HOUR(subscription.createTime)) AS SR ON DATE(SR.createTime) = DATE(cal.date) AND HOUR(SR.createTime) = HOUR(cal.date)
                    LEFT JOIN
                        (SELECT createTime, COUNT(id) as count, COUNT(DISTINCT userId) as userCount FROM tournament_entry GROUP BY DATE(createTime), HOUR(createTime)) AS T ON DATE(T.createTime) = DATE(cal.date) AND HOUR(T.createTime) = HOUR(cal.date)
                    LEFT JOIN
                        (SELECT tournament_entry.createTime, COUNT(tournament_entry.id) / COUNT(DISTINCT(tournament_entry.userId)) as avg FROM tournament_entry JOIN tournament ON tournamentId = tournament.id WHERE tournament.minLevel = 0 GROUP BY DATE(tournament_entry.createTime), HOUR(tournament_entry.createTime)) AS T2 ON DATE(T2.createTime) = DATE(cal.date) AND HOUR(T2.createTime) = HOUR(cal.date)
                    LEFT JOIN
                        (SELECT tournament_entry.createTime, COUNT(tournament_entry.id) / COUNT(DISTINCT(tournament_entry.userId)) as avg FROM tournament_entry JOIN tournament ON tournamentId = tournament.id WHERE tournament.minLevel > 0 GROUP BY DATE(tournament_entry.createTime), HOUR(tournament_entry.createTime)) AS T3 ON DATE(T3.createTime) = DATE(cal.date) AND HOUR(T3.createTime) = HOUR(cal.date)
                    LEFT JOIN
                        (SELECT tournament_entry.createTime, COUNT(tournament_entry.id) / COUNT(DISTINCT(tournament_entry.userId)) as avg FROM tournament_entry JOIN upgrade ON tournament_entry.userId = upgrade.id WHERE upgrade.createTime < tournament_entry.createTime GROUP BY DATE(tournament_entry.createTime), HOUR(tournament_entry.createTime)) AS T4 ON DATE(T4.createTime) = DATE(cal.date) AND HOUR(T4.createTime) = HOUR(cal.date)
                    LEFT JOIN
                        (SELECT createTime, SUM(baseAmount) as total FROM wallet_transaction WHERE purpose = 'Payout' AND currencyCode != 'DIA' AND baseAmount > 0 GROUP BY DATE(createTime), HOUR(createTime)) AS P ON DATE(P.createTime) = DATE(cal.date) AND HOUR(P.createTime) = HOUR(cal.date)
                    LEFT JOIN
                        (SELECT createTime, SUM(baseAmount) as revenue FROM wallet_transaction WHERE purpose IN('Deposit', 'Subscription', 'Purchase') AND baseAmount > 0 GROUP BY DATE(createTime), HOUR(createTime)) AS R ON DATE(R.createTime) = DATE(cal.date) AND HOUR(SR.createTime) = HOUR(cal.date)
                    WHERE
                        cal.date < @MaxDate
                    GROUP BY
                        DATE(cal.date),
                        HOUR(cal.date)
                    ORDER BY
                        cal.date ASC
                    ON DUPLICATE KEY UPDATE
                        usersNew = VALUES(usersNew), 
                        tournamentEntries = VALUES(tournamentEntries), 
                        tournamentUsers = VALUES(tournamentUsers), 
                        tournamentAvgPlayedFree = VALUES(tournamentAvgPlayedFree), 
                        tournamentAvgPlayedVip = VALUES(tournamentAvgPlayedVip), 
                        userAvgTournamentPreVip = VALUES(userAvgTournamentPreVip), 
                        subscriptionsNew = VALUES(subscriptionsNew), 
                        subscriptionsRenewed = VALUES(subscriptionsRenewed),
                        userAvgSubscribeTime = VALUES(userAvgSubscribeTime), 
                        prizePayoutBase = VALUES(prizePayoutBase), 
                        revenue = VALUES(revenue),
                        updateTime = CURRENT_TIMESTAMP;
            END
        `.replace(/\s+/g, ' ');;

        await queryRunner.query(query);
    }

}
