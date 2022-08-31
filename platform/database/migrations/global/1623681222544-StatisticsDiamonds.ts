import {MigrationInterface, QueryRunner} from "typeorm";

export class StatisticsDiamonds1623681222544 implements MigrationInterface {
    name = 'StatisticsDiamonds1623681222544'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `prizePayoutDiamonds` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `jackpotPayout` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_daily` ADD `jackpotPayoutCount` int NOT NULL");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `prizePayoutDiamonds` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `jackpotPayout` decimal(16,4) NOT NULL DEFAULT '0.0000'");
        await queryRunner.query("ALTER TABLE `statistics_hourly` ADD `jackpotPayoutCount` int NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `jackpotPayoutCount`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `jackpotPayout`");
        await queryRunner.query("ALTER TABLE `statistics_hourly` DROP COLUMN `prizePayoutDiamonds`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `jackpotPayoutCount`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `jackpotPayout`");
        await queryRunner.query("ALTER TABLE `statistics_daily` DROP COLUMN `prizePayoutDiamonds`");
    }

}
