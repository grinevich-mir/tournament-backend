import {MigrationInterface, QueryRunner} from "typeorm";

export class SubscriptionTrial1610370960429 implements MigrationInterface {
    name = 'SubscriptionTrial1610370960429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription_tier` ADD `trialable` tinyint NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `subscription` ADD `trialling` tinyint NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `subscription` ADD `trialStartTime` datetime NULL");
        await queryRunner.query("ALTER TABLE `subscription` ADD `trialEndTime` datetime NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `trialEndTime`");
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `trialStartTime`");
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `trialling`");
        await queryRunner.query("ALTER TABLE `subscription_tier` DROP COLUMN `trialable`");
    }

}
