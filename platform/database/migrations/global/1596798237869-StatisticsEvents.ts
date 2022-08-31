import { MigrationInterface, QueryRunner } from "typeorm";

export class StatisticsEvents1596798237870 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {

        const getQueries = () => {
            const where = 'WHERE createTime >= @startTime AND createTime < @endTime';
            return {
                getUserNew: `SELECT COUNT(*) FROM user ${where}`,
                getUserConverted: `SELECT COUNT(*) FROM upgrade  ${where}`,
                getUserInteractions: `SELECT COUNT(DISTINCT(userId)) FROM tournament_entry ${where}`,
                getRevenue: `SELECT SUM(baseAmount) FROM wallet_transaction ${where} AND purpose IN('Deposit', 'Subscription', 'Purchase') AND baseAmount > 0`,
                getGamePlayed: `SELECT COUNT(*) FROM tournament_entry ${where}`,
                getGamePrizePayoutDIA: `SELECT SUM(amountRaw) FROM wallet_transaction ${where} AND currencyCode = 'DIA' AND amountRaw > 0 AND purpose = 'PayOut'`,
                getGamePrizePayoutUSD: `SELECT SUM(baseAmount) FROM wallet_transaction ${where} AND currencyCode != 'DIA' AND baseAmount > 0 AND purpose = 'PayOut'`,
                getAvgGamePlayedFree: `SELECT COUNT(tournament_entry.id) / COUNT(DISTINCT(tournament_entry.userId)) FROM tournament_entry JOIN tournament ON tournamentId = tournament.id ${where.replace(/createTime/g, 'tournament_entry.createTime')} AND tournament.minLevel = 0`,
                getAvgGamePlayedVip: `SELECT COUNT(tournament_entry.id) / COUNT(DISTINCT(tournament_entry.userId)) FROM tournament_entry JOIN tournament ON tournamentId = tournament.id ${where.replace(/createTime/g, 'tournament_entry.createTime')} AND tournament.minLevel > 0`,
                getAvgUserUpgradeTime: `SELECT AVG(upgrade.createTime - user.createTime) FROM upgrade JOIN user ON user.id = upgrade.userId ${where.replace(/createTime/g, 'upgrade.createTime')}`,
                getAvgUserGamePreVip: `SELECT COUNT(tournament_entry.id) / COUNT(DISTINCT(tournament_entry.userId)) FROM tournament_entry JOIN upgrade ON tournament_entry.userId = upgrade.userId ${where.replace(/createTime/g, 'tournament_entry.createTime')} AND upgrade.createTime < tournament_entry.createTime`
            }
        };

        const getInsertStatement = (table: string, frequency: string, data: any) =>
            (`CREATE EVENT ${table}
                ON SCHEDULE EVERY 1 ${frequency} STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY)
                DO
                BEGIN
                SET @startTime = NOW() - INTERVAL 1 ${frequency};
                SET @endTime = @startTime + INTERVAL 1 ${frequency};
                INSERT INTO ${table}
                (
                    date,
                    userNew,
                    userConverted,
                    userInteractions,
                    revenue,
                    gamePlayed,
                    gamePrizePayoutDIA,
                    gamePrizePayoutUSD,
                    gameAvgPlayedFree,
                    gameAvgPlayedVip,
                    userAvgUpgradeTime,
                    userAvgGamePreVip,
                    createTime
                )
                VALUES
                (
                    @endTime,
                    IFNULL((${data.getUserNew}), 0),
                    IFNULL((${data.getUserConverted}), 0),
                    IFNULL((${data.getUserInteractions}), 0),
                    IFNULL((${data.getRevenue}), 0),
                    IFNULL((${data.getGamePlayed}), 0),
                    IFNULL((${data.getGamePrizePayoutDIA}), 0),
                    IFNULL((${data.getGamePrizePayoutUSD}), 0),
                    IFNULL((${data.getAvgGamePlayedFree}), 0),
                    IFNULL((${data.getAvgGamePlayedVip}), 0),
                    IFNULL((${data.getAvgUserUpgradeTime}), 0),
                    IFNULL((${data.getAvgUserGamePreVip}), 0),
                    NOW()
                );
                END
                `).replace(/\s+/g, ' ');

        const queries = getQueries();

        await queryRunner.query(getInsertStatement("statistics_daily", 'DAY', queries));
        await queryRunner.query(getInsertStatement("statistics_hourly", 'HOUR', queries));
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("DROP EVENT statistics_daily;");
        await queryRunner.query("DROP EVENT statistics_hourly;");
    }

}
