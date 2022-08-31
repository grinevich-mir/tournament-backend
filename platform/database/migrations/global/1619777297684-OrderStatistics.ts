import {MigrationInterface, QueryRunner} from "typeorm";

export class OrderStatistics1619777297684 implements MigrationInterface {
    name = 'OrderStatistics1619777297684'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `userAvgSubscribeTime`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `userAvgTournamentPreVip`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `tournamentAvgPlayedFree`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `tournamentAvgPlayedVip`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `userAvgSubscribeTime`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `userAvgTournamentPreVip`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `tournamentAvgPlayedFree`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `tournamentAvgPlayedVip`");
        await queryRunner.query("ALTER TABLE `order` ADD `completeTime` datetime NULL");
        await queryRunner.query("UPDATE `order` SET `completeTime` = `updateTime` WHERE status = 'Complete'");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `tournamentEntriesDiamondsSpent` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `tournamentEntriesDiamondsRefunded` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `ordersCreated` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `ordersCompleted` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `ordersDiamonds` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `tournamentEntriesDiamondsSpent` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `tournamentEntriesDiamondsRefunded` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `ordersCreated` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `ordersCompleted` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `ordersDiamonds` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `purchaseRevenue` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `purchaseRevenue` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_daily` CHANGE `subscriptionsCancelled` `subscriptionsCancelled` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` CHANGE `revenue` `revenue` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_daily` CHANGE `prizePayoutBase` `prizePayoutBase` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_hourly` CHANGE `subscriptionsCancelled` `subscriptionsCancelled` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` CHANGE `revenue` `revenue` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_hourly` CHANGE `prizePayoutBase` `prizePayoutBase` decimal(16,4) NOT NULL DEFAULT '0.0000'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `statistics_hourly` CHANGE `prizePayoutBase` `prizePayoutBase` decimal(16,4) NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` CHANGE `revenue` `revenue` decimal(16,4) NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` CHANGE `subscriptionsCancelled` `subscriptionsCancelled` int NOT NULL DEFAULT '0'");
        await queryRunner.query("ALTER TABLE `statistics_daily` CHANGE `prizePayoutBase` `prizePayoutBase` decimal(16,4) NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` CHANGE `revenue` `revenue` decimal(16,4) NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` CHANGE `subscriptionsCancelled` `subscriptionsCancelled` int NOT NULL DEFAULT '0'");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `ordersDiamonds`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `ordersCompleted`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `ordersCreated`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `tournamentEntriesDiamondsRefunded`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `tournamentEntriesDiamondsSpent`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `ordersDiamonds`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `ordersCompleted`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `ordersCreated`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `tournamentEntriesDiamondsRefunded`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `tournamentEntriesDiamondsSpent`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `purchaseRevenue`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `purchaseRevenue`");
        await queryRunner.query("ALTER TABLE `order` DROP COLUMN `completeTime`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `tournamentAvgPlayedVip` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `tournamentAvgPlayedFree` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `userAvgTournamentPreVip` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `userAvgSubscribeTime` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `tournamentAvgPlayedVip` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `tournamentAvgPlayedFree` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `userAvgTournamentPreVip` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `userAvgSubscribeTime` int NOT NULL");
    }

}
