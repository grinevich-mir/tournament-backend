import { MigrationInterface, QueryRunner } from "typeorm";

export class DropStatisticsTopEvents1614851129250 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("DROP EVENT statistics_top;");
        await queryRunner.query("ALTER TABLE `statistics_top` DROP FOREIGN KEY `FK_a306ac6cea1b1cec2a46d191335`", undefined);
        await queryRunner.query("DROP INDEX `IDX_675bc992e72efc825181cd07f7` ON `statistics_top`", undefined);
        await queryRunner.query("DROP TABLE `statistics_top`", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query("CREATE TABLE `statistics_top` (`id` int NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `winnings` decimal(16,4) NOT NULL, `currencyCode` varchar(255) NOT NULL, `createTime` datetime NOT NULL, INDEX `IDX_675bc992e72efc825181cd07f7` (`createTime`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `statistics_top` ADD CONSTRAINT `FK_a306ac6cea1b1cec2a46d191335` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query((`
            CREATE EVENT statistics_top
            ON SCHEDULE EVERY 15 MINUTE STARTS DATE_FORMAT(CURRENT_TIMESTAMP, "%y-%m-%d %H:00:00")
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

}
