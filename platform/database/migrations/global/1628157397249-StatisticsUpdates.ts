import {MigrationInterface, QueryRunner} from "typeorm";

export class StatisticsUpdates1628157397249 implements MigrationInterface {
    name = 'StatisticsUpdates1628157397249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `tournamentNewUsers` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `tournamentEntriesAllocations` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `ordersCreatedNewUsers` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `ordersCreatedUsers` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `ordersCompletedNewUsers` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `ordersCompletedUsers` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseDeclinedNewUserCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseNewUserRevenue` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseFirstTimeUserCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseFirstTimeRevenue` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseFirstTimeRevenueInPeriod` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseDeclinedCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseDeclinedUserCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `tournamentNewUsers` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `tournamentEntriesAllocations` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `ordersCreatedNewUsers` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `ordersCreatedUsers` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `ordersCompletedNewUsers` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `ordersCompletedUsers` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseDeclinedNewUserCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseNewUserRevenue` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseFirstTimeUserCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseFirstTimeRevenue` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseFirstTimeRevenueInPeriod` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseDeclinedCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseDeclinedUserCount` int NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseDeclinedUserCount`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseDeclinedCount`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseCount`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseFirstTimeRevenueInPeriod`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseFirstTimeRevenue`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseFirstTimeUserCount`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseNewUserRevenue`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseDeclinedNewUserCount`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `ordersCompletedUsers`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `ordersCompletedNewUsers`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `ordersCreatedUsers`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `ordersCreatedNewUsers`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `tournamentEntriesAllocations`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `tournamentNewUsers`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseDeclinedUserCount`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseDeclinedCount`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseCount`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseFirstTimeRevenueInPeriod`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseFirstTimeRevenue`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseFirstTimeUserCount`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseNewUserRevenue`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseDeclinedNewUserCount`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `ordersCompletedUsers`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `ordersCompletedNewUsers`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `ordersCreatedUsers`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `ordersCreatedNewUsers`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `tournamentEntriesAllocations`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `tournamentNewUsers`");
    }

}
