import {MigrationInterface, QueryRunner} from "typeorm";

export class SubscriptionsUpdate1607091151260 implements MigrationInterface {
    name = 'SubscriptionsUpdate1607091151260'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription_payment_wallet_entry` DROP FOREIGN KEY `FK_9c97c7535cee99afbe17d4bb45b`", undefined);
        await queryRunner.query("ALTER TABLE `subscription_payment_wallet_entry` DROP FOREIGN KEY `FK_461cbb33a171008d7b1c1cd3a16`", undefined);
        await queryRunner.query("ALTER TABLE `subscription_payment` DROP FOREIGN KEY `FK_bc53bda0f52706bfe2ec7f85b72`", undefined);
        await queryRunner.query("ALTER TABLE `subscription_payment` DROP FOREIGN KEY `FK_ca1d88ef8c0ad9a244bffa4376e`", undefined);
        await queryRunner.query("DROP INDEX `IDX_9c97c7535cee99afbe17d4bb45` ON `subscription_payment_wallet_entry`", undefined);
        await queryRunner.query("DROP INDEX `IDX_461cbb33a171008d7b1c1cd3a1` ON `subscription_payment_wallet_entry`", undefined);
        await queryRunner.query("DROP TABLE `subscription_payment_wallet_entry`", undefined);
        await queryRunner.query("DROP INDEX `IDX_1b6ef86272e0d7799af38b14c7` ON `subscription_payment`", undefined);
        await queryRunner.query("DROP TABLE `subscription_payment`", undefined);

        await queryRunner.query("CREATE TABLE `subscription_payment` (`subscriptionId` int NOT NULL, `paymentId` int UNSIGNED NOT NULL, INDEX `IDX_ca1d88ef8c0ad9a244bffa4376` (`subscriptionId`), INDEX `IDX_93962395e9260b7bb49e2176f2` (`paymentId`), PRIMARY KEY (`subscriptionId`, `paymentId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `autoRenew`", undefined);
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `totalCycles`", undefined);
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `renewalCycles`", undefined);
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `remainingCycles`", undefined);
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `pauseCycles`", undefined);
        await queryRunner.query("ALTER TABLE `subscription` ADD `paymentMethodId` int NOT NULL", undefined);
        await queryRunner.query("DROP INDEX `IDX_e142925d97ee578d9f4966827b` ON `subscription`", undefined);
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `provider` `provider` enum ('Chargify') NOT NULL", undefined);
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_e142925d97ee578d9f4966827b` ON `subscription` (`provider`, `providerRef`)", undefined);
        await queryRunner.query("ALTER TABLE `subscription` ADD CONSTRAINT `FK_e363e81a757912d5a7eefadfc0f` FOREIGN KEY (`paymentMethodId`) REFERENCES `payment_method`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `subscription_payment` ADD CONSTRAINT `FK_ca1d88ef8c0ad9a244bffa4376e` FOREIGN KEY (`subscriptionId`) REFERENCES `subscription`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `subscription_payment` ADD CONSTRAINT `FK_93962395e9260b7bb49e2176f2c` FOREIGN KEY (`paymentId`) REFERENCES `payment`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription_payment` DROP FOREIGN KEY `FK_93962395e9260b7bb49e2176f2c`", undefined);
        await queryRunner.query("ALTER TABLE `subscription_payment` DROP FOREIGN KEY `FK_ca1d88ef8c0ad9a244bffa4376e`", undefined);
        await queryRunner.query("ALTER TABLE `subscription` DROP FOREIGN KEY `FK_e363e81a757912d5a7eefadfc0f`", undefined);
        await queryRunner.query("DROP INDEX `IDX_e142925d97ee578d9f4966827b` ON `subscription`", undefined);
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `provider` `provider` enum ('Recurly') NOT NULL", undefined);
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_e142925d97ee578d9f4966827b` ON `subscription` (`provider`, `providerRef`)", undefined);
        await queryRunner.query("ALTER TABLE `subscription` DROP COLUMN `paymentMethodId`", undefined);
        await queryRunner.query("ALTER TABLE `subscription` ADD `pauseCycles` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `subscription` ADD `remainingCycles` int NOT NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `subscription` ADD `renewalCycles` int NOT NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `subscription` ADD `totalCycles` int NOT NULL DEFAULT '0'", undefined);
        await queryRunner.query("ALTER TABLE `subscription` ADD `autoRenew` tinyint NOT NULL DEFAULT '1'", undefined);
        await queryRunner.query("DROP INDEX `IDX_bc5bfcd082d5f159d57c72751a` ON `subscription_payment`", undefined);
        await queryRunner.query("DROP INDEX `IDX_98bab8b3651084d4a4f1fdc6f0` ON `subscription_payment`", undefined);
        await queryRunner.query("DROP TABLE `subscription_payment`", undefined);

        await queryRunner.query("CREATE TABLE `subscription_payment` (`id` int NOT NULL AUTO_INCREMENT, `type` enum ('Purchase', 'Refund') NOT NULL, `status` enum ('Pending', 'Successful', 'Declined', 'Voided') NOT NULL DEFAULT 'Pending', `subscriptionId` int NOT NULL, `amount` decimal(16,4) NOT NULL, `currencyCode` varchar(3) NOT NULL, `provider` enum ('Recurly') NOT NULL, `providerRef` varchar(32) NOT NULL, `paymentMethodDetail` varchar(255) NOT NULL, `voidTime` datetime NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_1b6ef86272e0d7799af38b14c7` (`provider`, `providerRef`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `subscription_payment_wallet_entry` (`subscriptionPaymentId` int NOT NULL, `walletEntryId` int NOT NULL, INDEX `IDX_461cbb33a171008d7b1c1cd3a1` (`subscriptionPaymentId`), INDEX `IDX_9c97c7535cee99afbe17d4bb45` (`walletEntryId`), PRIMARY KEY (`subscriptionPaymentId`, `walletEntryId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `subscription_payment` ADD CONSTRAINT `FK_ca1d88ef8c0ad9a244bffa4376e` FOREIGN KEY (`subscriptionId`) REFERENCES `subscription`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `subscription_payment` ADD CONSTRAINT `FK_bc53bda0f52706bfe2ec7f85b72` FOREIGN KEY (`currencyCode`) REFERENCES `currency`(`code`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `subscription_payment_wallet_entry` ADD CONSTRAINT `FK_461cbb33a171008d7b1c1cd3a16` FOREIGN KEY (`subscriptionPaymentId`) REFERENCES `subscription_payment`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `subscription_payment_wallet_entry` ADD CONSTRAINT `FK_9c97c7535cee99afbe17d4bb45b` FOREIGN KEY (`walletEntryId`) REFERENCES `wallet_entry`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
    }

}
