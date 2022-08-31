import {MigrationInterface, QueryRunner} from "typeorm";

export class PaymentOptions1628157397251 implements MigrationInterface {
    name = 'PaymentOptions1628157397251'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `payment_option` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `provider` enum ('Chargify', 'Unipaas', 'Trustly') NOT NULL, `methodTypes` text NOT NULL, `enabled` tinyint NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `payment_option_country` (`countryCode` varchar(255) NOT NULL, `paymentOptionId` int NOT NULL, PRIMARY KEY (`countryCode`, `paymentOptionId`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `payment_option_currency` (`paymentOptionId` int NOT NULL, `currencyCode` varchar(3) NOT NULL, INDEX `IDX_3d4579007d4e87df87095a969e` (`paymentOptionId`), INDEX `IDX_faa65d0d72eec6f89299e2a95d` (`currencyCode`), PRIMARY KEY (`paymentOptionId`, `currencyCode`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `payment_option_country` ADD CONSTRAINT `FK_c56cbde0671bdcac3f0a0cf45b6` FOREIGN KEY (`paymentOptionId`) REFERENCES `payment_option`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `payment_option_currency` ADD CONSTRAINT `FK_3d4579007d4e87df87095a969e9` FOREIGN KEY (`paymentOptionId`) REFERENCES `payment_option`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `payment_option_currency` ADD CONSTRAINT `FK_faa65d0d72eec6f89299e2a95df` FOREIGN KEY (`currencyCode`) REFERENCES `currency`(`code`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_option_currency` DROP FOREIGN KEY `FK_faa65d0d72eec6f89299e2a95df`");
        await queryRunner.query("ALTER TABLE `payment_option_currency` DROP FOREIGN KEY `FK_3d4579007d4e87df87095a969e9`");
        await queryRunner.query("ALTER TABLE `payment_option_country` DROP FOREIGN KEY `FK_c56cbde0671bdcac3f0a0cf45b6`");
        await queryRunner.query("DROP INDEX `IDX_faa65d0d72eec6f89299e2a95d` ON `payment_option_currency`");
        await queryRunner.query("DROP INDEX `IDX_3d4579007d4e87df87095a969e` ON `payment_option_currency`");
        await queryRunner.query("DROP TABLE `payment_option_currency`");
        await queryRunner.query("DROP TABLE `payment_option_country`");
        await queryRunner.query("DROP TABLE `payment_option`");
    }

}
