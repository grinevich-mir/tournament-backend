import {MigrationInterface, QueryRunner} from "typeorm";

export class SubscriptionTierVariantTrial1612196589254 implements MigrationInterface {
    name = 'SubscriptionTierVariantTrial1612196589254'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription_tier` DROP COLUMN `trialable`");
        await queryRunner.query("ALTER TABLE `subscription_tier_price` ADD `trialAmount` decimal(16,4) NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `subscription_tier_variant` ADD `trialEnabled` tinyint NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `subscription_tier_variant` ADD `trialPeriod` enum ('Day', 'Week', 'Month', 'Year') NOT NULL DEFAULT 'Day'");
        await queryRunner.query("ALTER TABLE `subscription_tier_variant` ADD `trialDuration` int NOT NULL DEFAULT 1");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription_tier_variant` DROP COLUMN `trialDuration`");
        await queryRunner.query("ALTER TABLE `subscription_tier_variant` DROP COLUMN `trialPeriod`");
        await queryRunner.query("ALTER TABLE `subscription_tier_variant` DROP COLUMN `trialEnabled`");
        await queryRunner.query("ALTER TABLE `subscription_tier_price` DROP COLUMN `trialAmount`");
        await queryRunner.query("ALTER TABLE `subscription_tier` ADD `trialable` tinyint NOT NULL DEFAULT '0'");
    }

}
