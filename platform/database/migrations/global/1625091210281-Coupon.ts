import { MigrationInterface, QueryRunner } from "typeorm";

export class Coupon1625091210281 implements MigrationInterface {
    name = 'Coupon1625091210281'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `coupon` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `validFrom` datetime NOT NULL, `validTo` datetime NULL, `code` varchar(255) NOT NULL, `amountOff` decimal(16,4) NULL, `percentOff` decimal(16,4) NULL, `bonusItems` text NULL, `restrictions` text NULL, `redemptionCount` int NOT NULL DEFAULT 0, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `coupon_redemption` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `couponId` int(10) UNSIGNED NULL, `userId` int NULL, `orderId` int(10) UNSIGNED NULL, UNIQUE INDEX `REL_9d07c91db8e9abdb184031ad3a` (`orderId`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `order` ADD `couponCode` int NULL");
        await queryRunner.query("ALTER TABLE `order` ADD `couponTotal` decimal(16,4) NULL");
        await queryRunner.query("ALTER TABLE `coupon_redemption` ADD CONSTRAINT `FK_e43c4478e4fe1968af79e58435b` FOREIGN KEY (`couponId`) REFERENCES `coupon`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `coupon_redemption` ADD CONSTRAINT `FK_9c343c373eb0d05b96d0621f982` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `coupon_redemption` ADD CONSTRAINT `FK_9d07c91db8e9abdb184031ad3af` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `coupon_redemption` DROP FOREIGN KEY `FK_9d07c91db8e9abdb184031ad3af`");
        await queryRunner.query("ALTER TABLE `coupon_redemption` DROP FOREIGN KEY `FK_9c343c373eb0d05b96d0621f982`");
        await queryRunner.query("ALTER TABLE `coupon_redemption` DROP FOREIGN KEY `FK_8e2b018ed0091fa11714dd7b3e1`");
        await queryRunner.query("ALTER TABLE `order` DROP COLUMN `couponCode`");
        await queryRunner.query("ALTER TABLE `order` DROP COLUMN `couponTotal`");
        await queryRunner.query("DROP INDEX `REL_9d07c91db8e9abdb184031ad3a` ON `coupon_redemption`");
        await queryRunner.query("DROP TABLE `coupon_redemption`");
        await queryRunner.query("DROP TABLE `coupon`");
    }
}
