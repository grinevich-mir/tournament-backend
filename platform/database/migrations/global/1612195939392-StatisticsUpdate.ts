import {MigrationInterface, QueryRunner} from "typeorm";

export class StatisticsUpdate1612195939392 implements MigrationInterface {
    name = 'StatisticsUpdate1612195939392'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD COLUMN `subscriptionsCancelled` int NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD COLUMN `subscriptionsNewRevenue` decimal(16,4) NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD COLUMN `subscriptionsRenewedRevenue` decimal(16,4) NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD COLUMN `subscriptionsCancelled` int NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD COLUMN `subscriptionsNewRevenue` decimal(16,4) NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD COLUMN `subscriptionsRenewedRevenue` decimal(16,4) NOT NULL DEFAULT 0");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `subscriptionsCancelled`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `subscriptionsNewRevenue`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `subscriptionsRenewedRevenue`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `subscriptionsCancelled`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `subscriptionsNewRevenue`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `subscriptionsRenewedRevenue`");
    }

}
