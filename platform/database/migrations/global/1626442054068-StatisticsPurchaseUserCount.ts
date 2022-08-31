import { MigrationInterface, QueryRunner } from "typeorm";

export class StatisticsPurchaseUserCount1626442054068 implements MigrationInterface {
    name = 'StatisticsPurchaseUserCount1626442054068'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseUserCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseNewUserCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseUserCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseNewUserCount` int NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseNewUserCount`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseUserCount`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseNewUserCount`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseUserCount`");
    }
}
