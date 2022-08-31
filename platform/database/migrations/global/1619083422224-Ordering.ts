import {MigrationInterface, QueryRunner} from "typeorm";

export class Ordering1619083422224 implements MigrationInterface {
    name = 'Ordering1619083422224'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `order` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `description` varchar(255) NOT NULL, `currencyCode` varchar(3) NOT NULL, `priceTotal` decimal(16,4) NOT NULL, `status` enum ('Pending', 'Paid', 'Complete', 'Expired') NOT NULL DEFAULT 'Pending', `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `order_item` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `orderId` int(10) UNSIGNED NOT NULL, `type` enum ('Diamonds') NOT NULL, `description` varchar(255) NOT NULL, `quantity` int NOT NULL, `price` decimal(16,4) NOT NULL, `processedTime` datetime NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `order_payment` (`orderId` int(10) UNSIGNED NOT NULL, `paymentId` int(10) UNSIGNED NOT NULL, INDEX `IDX_8e5de5355bcad91a7769f16504` (`orderId`), INDEX `IDX_594044bf6dd3fb34a69d0c627c` (`paymentId`), PRIMARY KEY (`orderId`, `paymentId`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `order` ADD CONSTRAINT `FK_caabe91507b3379c7ba73637b84` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `order` ADD CONSTRAINT `FK_349980a98430c4c5023992c2811` FOREIGN KEY (`currencyCode`) REFERENCES `currency`(`code`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `order_item` ADD CONSTRAINT `FK_646bf9ece6f45dbe41c203e06e0` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `order_payment` ADD CONSTRAINT `FK_8e5de5355bcad91a7769f16504c` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `order_payment` ADD CONSTRAINT `FK_594044bf6dd3fb34a69d0c627c6` FOREIGN KEY (`paymentId`) REFERENCES `payment`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `order_payment` DROP FOREIGN KEY `FK_594044bf6dd3fb34a69d0c627c6`");
        await queryRunner.query("ALTER TABLE `order_payment` DROP FOREIGN KEY `FK_8e5de5355bcad91a7769f16504c`");
        await queryRunner.query("ALTER TABLE `order_item` DROP FOREIGN KEY `FK_646bf9ece6f45dbe41c203e06e0`");
        await queryRunner.query("ALTER TABLE `order` DROP FOREIGN KEY `FK_349980a98430c4c5023992c2811`");
        await queryRunner.query("ALTER TABLE `order` DROP FOREIGN KEY `FK_caabe91507b3379c7ba73637b84`");
        await queryRunner.query("DROP INDEX `IDX_594044bf6dd3fb34a69d0c627c` ON `order_payment`");
        await queryRunner.query("DROP INDEX `IDX_8e5de5355bcad91a7769f16504` ON `order_payment`");
        await queryRunner.query("DROP TABLE `order_payment`");
        await queryRunner.query("DROP TABLE `order_item`");
        await queryRunner.query("DROP TABLE `order`");
    }

}
