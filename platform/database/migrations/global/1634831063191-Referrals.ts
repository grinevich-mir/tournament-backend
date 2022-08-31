import {MigrationInterface, QueryRunner} from "typeorm";

export class Referrals1634831063191 implements MigrationInterface {
    name = 'Referrals1634831063191'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` DROP FOREIGN KEY `FK_adc492faf309ebf60ca6425e183`");
        await queryRunner.query("DROP INDEX `IDX_bf0e513b5cd8b4e937fa070231` ON `user`");
        await queryRunner.query("CREATE TABLE `referral_group` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(50) NOT NULL, `default` tinyint NOT NULL DEFAULT 0, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `referral_commission_rate` (`groupId` int NOT NULL, `level` int NOT NULL, `rate` decimal(16,4) NOT NULL, `minAmount` decimal(16,4) NOT NULL DEFAULT 0, `maxAmount` decimal(16,4) NULL, `enabled` tinyint NOT NULL DEFAULT 0, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`groupId`, `level`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `referral_user` (`userId` int NOT NULL, `code` varchar(8) NOT NULL, `slug` varchar(255) NOT NULL, `groupId` int NOT NULL, `revenue` decimal(16,4) NOT NULL DEFAULT 0, `referralCount` int NOT NULL DEFAULT 0, `active` tinyint NOT NULL DEFAULT 0, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_66438419b2cf8d7b37d4b0fe06` (`code`), UNIQUE INDEX `IDX_2b0017a8ea69349a7ef9b3b4c2` (`slug`), PRIMARY KEY (`userId`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `referral` (`id` int NOT NULL AUTO_INCREMENT, `referrerUserId` int NOT NULL, `refereeUserId` int NOT NULL, `revenue` decimal(16,4) NOT NULL DEFAULT 0, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `IDX_e0c3d4fd66eb93f1e205fe7979` (`referrerUserId`, `refereeUserId`), UNIQUE INDEX `REL_abfdb9ecbb2773ba9a08b0e0e5` (`refereeUserId`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `referral_reward` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `type` enum ('Diamonds', 'Commission') NOT NULL, `event` enum ('SignUp', 'Payment') NOT NULL, `userId` int NOT NULL, `referralId` int NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `amount` int NULL, `commission` decimal(16,4), `walletEntryId` int NULL, `level` int NULL, `sourceAmount` decimal(16,4) NULL, `sourceType` enum ('Purchase', 'Subscription') NULL, `sourceId` int(10) UNSIGNED NULL, `rate` decimal(16,4) NULL, INDEX `IDX_5ace1949646dedb1b9b0f7bfe9` (`type`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `referral_rule` (`id` int NOT NULL AUTO_INCREMENT, `groupId` int NOT NULL, `event` enum ('SignUp', 'Payment') NOT NULL, `order` int NOT NULL DEFAULT 1, `enabled` tinyint NOT NULL DEFAULT 1, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `count` int NULL, `every` tinyint NULL DEFAULT 0, `minAmount` decimal(16,4) NULL, `minRevenue` decimal(16,4) NULL, UNIQUE INDEX `IDX_61a7445076232c03fd1f4d80ec` (`groupId`, `event`, `order`), INDEX `IDX_d597188b1af0f6a5e63aaedcea` (`event`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `referral_rule_action` (`id` int NOT NULL AUTO_INCREMENT, `type` enum ('AwardDiamonds', 'ChangeGroup') NOT NULL, `ruleId` int NOT NULL, `enabled` tinyint NOT NULL DEFAULT 1, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `amount` int NULL, `target` enum ('Referrer', 'Referee') NULL DEFAULT 'Referrer', `groupId` int NULL, INDEX `IDX_06039d0cf3944f2a18a8c963b7` (`type`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `referralCode`");
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `referredById`");
        await queryRunner.query("ALTER TABLE `wallet_entry` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'JackpotPayout', 'ReferralPayout', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase', 'Consolidate', 'Confiscation', 'Compensation') NOT NULL");
        await queryRunner.query("ALTER TABLE `wallet_transaction` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'JackpotPayout', 'ReferralPayout', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase', 'Consolidate', 'Confiscation', 'Compensation') NOT NULL");
        await queryRunner.query("ALTER TABLE `referral_commission_rate` ADD CONSTRAINT `FK_4a6447359d0f260da6da4f802f7` FOREIGN KEY (`groupId`) REFERENCES `referral_group`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `referral_user` ADD CONSTRAINT `FK_dfd7751caca41cfb79ffb7d8574` FOREIGN KEY (`groupId`) REFERENCES `referral_group`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `referral` ADD CONSTRAINT `FK_3e5e9893e28eb9d78d062bc64f3` FOREIGN KEY (`referrerUserId`) REFERENCES `referral_user`(`userId`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `referral` ADD CONSTRAINT `FK_abfdb9ecbb2773ba9a08b0e0e5c` FOREIGN KEY (`refereeUserId`) REFERENCES `referral_user`(`userId`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `referral_reward` ADD CONSTRAINT `FK_2ffef22fc829d68eb69e9be8cb6` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `referral_reward` ADD CONSTRAINT `FK_d9145a5d818d071b9094fcdf052` FOREIGN KEY (`referralId`) REFERENCES `referral`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `referral_reward` ADD CONSTRAINT `FK_4a599663c8425cd7c87d079f9c6` FOREIGN KEY (`walletEntryId`) REFERENCES `wallet_entry`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `referral_rule` ADD CONSTRAINT `FK_9c9f77537553cce2f6d440ab717` FOREIGN KEY (`groupId`) REFERENCES `referral_group`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `referral_rule_action` ADD CONSTRAINT `FK_c0cf283c5208d4187279698b391` FOREIGN KEY (`ruleId`) REFERENCES `referral_rule`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `referral_rule_action` DROP FOREIGN KEY `FK_c0cf283c5208d4187279698b391`");
        await queryRunner.query("ALTER TABLE `referral_rule` DROP FOREIGN KEY `FK_9c9f77537553cce2f6d440ab717`");
        await queryRunner.query("ALTER TABLE `referral_reward` DROP FOREIGN KEY `FK_4a599663c8425cd7c87d079f9c6`");
        await queryRunner.query("ALTER TABLE `referral_reward` DROP FOREIGN KEY `FK_d9145a5d818d071b9094fcdf052`");
        await queryRunner.query("ALTER TABLE `referral_reward` DROP FOREIGN KEY `FK_2ffef22fc829d68eb69e9be8cb6`");
        await queryRunner.query("ALTER TABLE `referral` DROP FOREIGN KEY `FK_abfdb9ecbb2773ba9a08b0e0e5c`");
        await queryRunner.query("ALTER TABLE `referral` DROP FOREIGN KEY `FK_3e5e9893e28eb9d78d062bc64f3`");
        await queryRunner.query("ALTER TABLE `referral_user` DROP FOREIGN KEY `FK_dfd7751caca41cfb79ffb7d8574`");
        await queryRunner.query("ALTER TABLE `referral_commission_rate` DROP FOREIGN KEY `FK_4a6447359d0f260da6da4f802f7`");
        await queryRunner.query("ALTER TABLE `wallet_transaction` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'JackpotPayout', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase', 'Consolidate', 'Confiscation', 'Compensation') NOT NULL");
        await queryRunner.query("ALTER TABLE `wallet_entry` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'JackpotPayout', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase', 'Consolidate', 'Confiscation', 'Compensation') NOT NULL");
        await queryRunner.query("ALTER TABLE `user` ADD `referredById` int NULL");
        await queryRunner.query("ALTER TABLE `user` ADD `referralCode` varchar(8) NULL");
        await queryRunner.query("DROP INDEX `IDX_06039d0cf3944f2a18a8c963b7` ON `referral_rule_action`");
        await queryRunner.query("DROP TABLE `referral_rule_action`");
        await queryRunner.query("DROP INDEX `IDX_d597188b1af0f6a5e63aaedcea` ON `referral_rule`");
        await queryRunner.query("DROP INDEX `IDX_61a7445076232c03fd1f4d80ec` ON `referral_rule`");
        await queryRunner.query("DROP TABLE `referral_rule`");
        await queryRunner.query("DROP INDEX `IDX_5ace1949646dedb1b9b0f7bfe9` ON `referral_reward`");
        await queryRunner.query("DROP TABLE `referral_reward`");
        await queryRunner.query("DROP INDEX `REL_abfdb9ecbb2773ba9a08b0e0e5` ON `referral`");
        await queryRunner.query("DROP INDEX `IDX_e0c3d4fd66eb93f1e205fe7979` ON `referral`");
        await queryRunner.query("DROP TABLE `referral`");
        await queryRunner.query("DROP INDEX `IDX_2b0017a8ea69349a7ef9b3b4c2` ON `referral_user`");
        await queryRunner.query("DROP INDEX `IDX_66438419b2cf8d7b37d4b0fe06` ON `referral_user`");
        await queryRunner.query("DROP TABLE `referral_user`");
        await queryRunner.query("DROP TABLE `referral_commission_rate`");
        await queryRunner.query("DROP TABLE `referral_group`");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_bf0e513b5cd8b4e937fa070231` ON `user` (`referralCode`)");
        await queryRunner.query("ALTER TABLE `user` ADD CONSTRAINT `FK_adc492faf309ebf60ca6425e183` FOREIGN KEY (`referredById`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

}
