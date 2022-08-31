import {MigrationInterface, QueryRunner} from "typeorm";

export class SubscriptionTierVariants1611676213944 implements MigrationInterface {
    name = 'SubscriptionTierVariants1611676213944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription_tier_price` DROP FOREIGN KEY `FK_7d7ac8607359782f0012fade8ab`");
        await queryRunner.query("ALTER TABLE `subscription_tier_price` CHANGE `tierId` `variantId` int NOT NULL");
        await queryRunner.query("CREATE TABLE `subscription_tier_variant` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `code` varchar(10) NOT NULL, `tierId` int NOT NULL, `period` enum ('Day', 'Week', 'Month', 'Year') NOT NULL DEFAULT 'Month', `frequency` int NOT NULL DEFAULT 1, `default` tinyint NOT NULL DEFAULT 0, `enabled` tinyint NOT NULL DEFAULT 0, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_c726e9ae841475d1be13ed3cef` (`tierId`, `code`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `subscription_tier` DROP COLUMN `period`");
        await queryRunner.query("ALTER TABLE `subscription_tier` DROP COLUMN `frequency`");
        await queryRunner.query("ALTER TABLE `subscription_promo` ADD `period` enum ('Day', 'Week', 'Month', 'Year') NOT NULL DEFAULT 'Month'");
        await queryRunner.query("ALTER TABLE `subscription` ADD `period` enum ('Day', 'Week', 'Month', 'Year') NOT NULL DEFAULT 'Month'");
        await queryRunner.query("ALTER TABLE `subscription` ADD `frequency` int NOT NULL DEFAULT 1");
        await queryRunner.query("ALTER TABLE `subscription` ADD `tierVariantId` int NOT NULL");
        await queryRunner.query("ALTER TABLE `subscription` ADD `nextTierVariantId` int NULL");
        await queryRunner.query("ALTER TABLE `subscription_tier_price` ADD CONSTRAINT `FK_b0c765509f7ad70cc8081f618f5` FOREIGN KEY (`variantId`) REFERENCES `subscription_tier_variant`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `subscription_tier_variant` ADD CONSTRAINT `FK_a7b31541853a79ba2f1472472ca` FOREIGN KEY (`tierId`) REFERENCES `subscription_tier`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `subscription` ADD CONSTRAINT `FK_f8b39442e69cdfd41276581e5a6` FOREIGN KEY (`tierVariantId`) REFERENCES `subscription_tier_variant`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `subscription` ADD CONSTRAINT `FK_1271069a0ba39c56d99264b9d6e` FOREIGN KEY (`nextTierVariantId`) REFERENCES `subscription_tier_variant`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription` DROP FOREIGN KEY `FK_1271069a0ba39c56d99264b9d6e`");
        await queryRunner.query("ALTER TABLE `subscription` DROP FOREIGN KEY `FK_f8b39442e69cdfd41276581e5a6`");
        await queryRunner.query("ALTER TABLE `subscription_tier_variant` DROP FOREIGN KEY `FK_a7b31541853a79ba2f1472472ca`");
        await queryRunner.query("ALTER TABLE `subscription_tier_price` DROP FOREIGN KEY `FK_b0c765509f7ad70cc8081f618f5`");
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `nextTierVariantId`");
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `tierVariantId`");
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `frequency`");
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `period`");
        await queryRunner.query("ALTER TABLE `subscription_promo` DROP COLUMN `period`");
        await queryRunner.query("ALTER TABLE `subscription_tier` ADD `frequency` int NOT NULL DEFAULT '1'");
        await queryRunner.query("ALTER TABLE `subscription_tier` ADD `period` enum ('Day', 'Week', 'Month', 'Year') NOT NULL DEFAULT 'Month'");
        await queryRunner.query("DROP INDEX `IDX_c726e9ae841475d1be13ed3cef` ON `subscription_tier_variant`");
        await queryRunner.query("DROP TABLE `subscription_tier_variant`");
        await queryRunner.query("ALTER TABLE `subscription_tier_price` CHANGE `variantId` `tierId` int NOT NULL");
        await queryRunner.query("ALTER TABLE `subscription_tier_price` ADD CONSTRAINT `FK_7d7ac8607359782f0012fade8ab` FOREIGN KEY (`tierId`) REFERENCES `subscription_tier`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

}
