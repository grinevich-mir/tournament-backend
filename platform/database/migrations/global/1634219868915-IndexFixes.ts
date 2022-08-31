import {MigrationInterface, QueryRunner} from "typeorm";

export class IndexFixes1634219868915 implements MigrationInterface {
    name = 'IndexFixes1634219868915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `coupon_redemption` DROP FOREIGN KEY `FK_9d07c91db8e9abdb184031ad3af`");
        await queryRunner.query("ALTER TABLE `coupon_redemption` DROP FOREIGN KEY `FK_9c343c373eb0d05b96d0621f982`");
        await queryRunner.query("ALTER TABLE `coupon_redemption` DROP FOREIGN KEY `FK_e43c4478e4fe1968af79e58435b`");
        await queryRunner.query("DROP INDEX `REL_9d07c91db8e9abdb184031ad3a` ON `coupon_redemption`");
        await queryRunner.query("ALTER TABLE `coupon_redemption` CHANGE `couponId` `couponId` int(10) UNSIGNED NOT NULL");
        await queryRunner.query("ALTER TABLE `coupon_redemption` CHANGE `userId` `userId` int NOT NULL");
        await queryRunner.query("ALTER TABLE `coupon_redemption` CHANGE `orderId` `orderId` int(10) UNSIGNED NOT NULL");
        await queryRunner.query("CREATE UNIQUE INDEX `REL_0d0ef2e7321111e72680ffdc0a` ON `coupon_redemption` (`orderId`)");
        await queryRunner.query("ALTER TABLE `user_log` ADD CONSTRAINT `FK_85f2dd25304ee3a9e43a5c5bcae` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `coupon_redemption` ADD CONSTRAINT `FK_1645faeb0c0f8e328913a5b9852` FOREIGN KEY (`couponId`) REFERENCES `coupon`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `coupon_redemption` ADD CONSTRAINT `FK_f641249f80a3c4781118136bf55` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `coupon_redemption` ADD CONSTRAINT `FK_0d0ef2e7321111e72680ffdc0a9` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `coupon_redemption` DROP FOREIGN KEY `FK_0d0ef2e7321111e72680ffdc0a9`");
        await queryRunner.query("ALTER TABLE `coupon_redemption` DROP FOREIGN KEY `FK_f641249f80a3c4781118136bf55`");
        await queryRunner.query("ALTER TABLE `coupon_redemption` DROP FOREIGN KEY `FK_1645faeb0c0f8e328913a5b9852`");
        await queryRunner.query("ALTER TABLE `user_log` DROP FOREIGN KEY `FK_85f2dd25304ee3a9e43a5c5bcae`");
        await queryRunner.query("DROP INDEX `REL_0d0ef2e7321111e72680ffdc0a` ON `coupon_redemption`");
        await queryRunner.query("ALTER TABLE `coupon_redemption` CHANGE `orderId` `orderId` int(10) UNSIGNED NULL");
        await queryRunner.query("ALTER TABLE `coupon_redemption` CHANGE `userId` `userId` int NULL");
        await queryRunner.query("ALTER TABLE `coupon_redemption` CHANGE `couponId` `couponId` int(10) UNSIGNED NULL");
        await queryRunner.query("CREATE UNIQUE INDEX `REL_9d07c91db8e9abdb184031ad3a` ON `coupon_redemption` (`orderId`)");
        await queryRunner.query("ALTER TABLE `coupon_redemption` ADD CONSTRAINT `FK_e43c4478e4fe1968af79e58435b` FOREIGN KEY (`couponId`) REFERENCES `coupon`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `coupon_redemption` ADD CONSTRAINT `FK_9c343c373eb0d05b96d0621f982` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `coupon_redemption` ADD CONSTRAINT `FK_9d07c91db8e9abdb184031ad3af` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

}
