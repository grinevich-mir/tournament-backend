import {MigrationInterface, QueryRunner} from "typeorm";

export class UpgradeLevelConfigWithdrawals1601477410757 implements MigrationInterface {
    name = 'UpgradeLevelConfigWithdrawals1601477410757'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upgrade_level_config` CHANGE `maxActiveEntries` `tournamentMaxActiveEntries` int NOT NULL", undefined);
        await queryRunner.query("ALTER TABLE `upgrade_level_config` ADD `withdrawalMinAmounts` text NULL", undefined);
        await queryRunner.query("ALTER TABLE `upgrade_level_config` ADD `withdrawalTargetDays` int NOT NULL DEFAULT 7", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upgrade_level_config` DROP COLUMN `withdrawalTargetDays`", undefined);
        await queryRunner.query("ALTER TABLE `upgrade_level_config` DROP COLUMN `withdrawalMinAmounts`", undefined);
        await queryRunner.query("ALTER TABLE `upgrade_level_config` CHANGE `tournamentMaxActiveEntries` `maxActiveEntries` int NOT NULL", undefined);
    }

}
