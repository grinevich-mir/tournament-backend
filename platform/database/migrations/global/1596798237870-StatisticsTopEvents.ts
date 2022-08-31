import { MigrationInterface, QueryRunner } from "typeorm";

export class StatisticsTopEvents1596795221814 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query((`
            CREATE EVENT statistics_top
            ON SCHEDULE EVERY 1 DAY STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY)
            DO
            BEGIN
            TRUNCATE statistics_top;
            INSERT INTO statistics_top
            (
                userId,
                currencyCode,
                winnings,
                createTime
            )
            SELECT wallet.userId, 'DIA' as currencyCode, IFNULL(SUM(wallet_transaction.amountRaw), 0) as winnings, CURRENT_TIMESTAMP FROM wallet_transaction JOIN wallet ON walletId = wallet.id WHERE wallet_transaction.currencyCode = 'DIA' AND wallet_transaction.baseAmount > 0 AND wallet_transaction.purpose = 'PayOut' GROUP BY wallet.userId ORDER BY SUM(wallet_transaction.amountRaw) DESC LIMIT 20;
            INSERT INTO statistics_top
            (
                userId,
                currencyCode,
                winnings,
                createTime
            )
            SELECT wallet.userId, 'USD' as currencyCode, IFNULL(SUM(wallet_transaction.baseAmount), 0) as winnings, CURRENT_TIMESTAMP FROM wallet_transaction JOIN wallet ON walletId = wallet.id WHERE wallet_transaction.currencyCode != 'DIA' AND wallet_transaction.baseAmount > 0 AND wallet_transaction.purpose = 'PayOut' GROUP BY wallet.userId ORDER BY SUM(wallet_transaction.baseAmount) DESC LIMIT 20;
            END`
        ).replace(/\s+/g, ' '));
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("DROP EVENT statistics_top;");
    }

}
