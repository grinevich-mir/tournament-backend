import {MigrationInterface, QueryRunner} from "typeorm";

export class Payments1607086623965 implements MigrationInterface {
    name = 'Payments1607086623965'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `payment` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `type` enum ('Subscription', 'Purchase', 'Refund') NOT NULL, `status` enum ('Pending', 'Successful', 'Declined', 'Voided') NOT NULL DEFAULT 'Pending', `paymentMethodId` int NOT NULL, `amount` decimal(16,4) NOT NULL, `currencyCode` varchar(3) NOT NULL, `memo` varchar(255) NULL, `provider` enum ('Chargify') NOT NULL, `providerRef` varchar(32) NOT NULL, `voidTime` datetime NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `payment_method` (`id` int NOT NULL AUTO_INCREMENT, `type` enum ('CreditCard', 'BankAccount') NOT NULL, `userId` int NOT NULL, `provider` enum ('Chargify') NOT NULL, `providerRef` varchar(255) NOT NULL, `enabled` tinyint NOT NULL DEFAULT 0, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `cardType` enum ('Unknown', 'Test', 'Visa', 'MasterCard', 'Discover', 'AmericanExpress', 'DinersClub', 'JCB', 'Switch', 'Solo', 'Dankort', 'Maestro', 'Forbrugsforeningen', 'Laser') NULL, `lastFour` varchar(4) NULL, `expiryMonth` int(2) NULL, `expiryYear` int(4) NULL, `routingNumber` varchar(16) NULL, `accountNumber` varchar(16) NULL, INDEX `IDX_3429b9b83191f8682e28047276` (`type`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `payment_wallet_entry` (`paymentId` int(10) UNSIGNED NOT NULL, `walletEntryId` int NOT NULL, INDEX `IDX_a6e6eef0aa42d7d83fd9a5b7ef` (`paymentId`), INDEX `IDX_38409486f5575699de974872b4` (`walletEntryId`), PRIMARY KEY (`paymentId`, `walletEntryId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `payment` ADD CONSTRAINT `FK_b046318e0b341a7f72110b75857` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `payment` ADD CONSTRAINT `FK_fb76bf2f52ca15e599f50bb34ae` FOREIGN KEY (`paymentMethodId`) REFERENCES `payment_method`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `payment` ADD CONSTRAINT `FK_b324c8aebf9289555d8f9230c2b` FOREIGN KEY (`currencyCode`) REFERENCES `currency`(`code`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `payment_method` ADD CONSTRAINT `FK_34a4419ef2010224d7ff600659d` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `payment_wallet_entry` ADD CONSTRAINT `FK_a6e6eef0aa42d7d83fd9a5b7efa` FOREIGN KEY (`paymentId`) REFERENCES `payment`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `payment_wallet_entry` ADD CONSTRAINT `FK_38409486f5575699de974872b43` FOREIGN KEY (`walletEntryId`) REFERENCES `wallet_entry`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_wallet_entry` DROP FOREIGN KEY `FK_38409486f5575699de974872b43`", undefined);
        await queryRunner.query("ALTER TABLE `payment_wallet_entry` DROP FOREIGN KEY `FK_a6e6eef0aa42d7d83fd9a5b7efa`", undefined);
        await queryRunner.query("ALTER TABLE `payment_method` DROP FOREIGN KEY `FK_34a4419ef2010224d7ff600659d`", undefined);
        await queryRunner.query("ALTER TABLE `payment` DROP FOREIGN KEY `FK_b324c8aebf9289555d8f9230c2b`", undefined);
        await queryRunner.query("ALTER TABLE `payment` DROP FOREIGN KEY `FK_fb76bf2f52ca15e599f50bb34ae`", undefined);
        await queryRunner.query("ALTER TABLE `payment` DROP FOREIGN KEY `FK_b046318e0b341a7f72110b75857`", undefined);
        await queryRunner.query("DROP INDEX `IDX_38409486f5575699de974872b4` ON `payment_wallet_entry`", undefined);
        await queryRunner.query("DROP INDEX `IDX_a6e6eef0aa42d7d83fd9a5b7ef` ON `payment_wallet_entry`", undefined);
        await queryRunner.query("DROP TABLE `payment_wallet_entry`", undefined);
        await queryRunner.query("DROP INDEX `IDX_3429b9b83191f8682e28047276` ON `payment_method`", undefined);
        await queryRunner.query("DROP TABLE `payment_method`", undefined);
        await queryRunner.query("DROP TABLE `payment`", undefined);
    }

}
