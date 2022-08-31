import {MigrationInterface, QueryRunner} from "typeorm";

export class Jackpots1603441111275 implements MigrationInterface {
    name = 'Jackpots1603441111275'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `jackpot` (`id` int NOT NULL AUTO_INCREMENT, `type` enum ('Tangible', 'Fixed', 'Progressive') NOT NULL, `name` varchar(255) NOT NULL, `label` varchar(255) NOT NULL, `enabled` tinyint NOT NULL DEFAULT 1, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `seed` decimal(16,4) NULL, `balance` decimal(16,4) NULL, `balanceUpdateTime` datetime NULL DEFAULT CURRENT_TIMESTAMP, `splitPayout` tinyint NULL DEFAULT 1, `lastPayoutTime` datetime NULL, `lastPayoutAmount` decimal(16,4) NULL, `contributionGroup` varchar(15) NULL, `contributionMultiplier` decimal(16,4) NULL, `maxContribution` decimal(16,4) NULL, `maxBalance` decimal(16,4) NULL, INDEX `IDX_c79760730093a92ba9304dd9f6` (`type`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `jackpot_adjustment` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `jackpotId` int NOT NULL, `amount` decimal(10,4) NOT NULL, `purpose` enum ('Seed', 'Payout', 'Contribution') NOT NULL, `sourceRef` varchar(255) NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `jackpot_payout` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `jackpotId` int NOT NULL, `userId` int NOT NULL, `amount` decimal(10,4) NOT NULL, `walletEntryId` int NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX `REL_93fc17769b5ae92d59b5fefe6b` (`walletEntryId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `tournament_template_jackpot_trigger` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `threshold` int NOT NULL, `jackpotId` int NOT NULL, `minLevel` int NOT NULL DEFAULT 0, `final` tinyint NOT NULL DEFAULT 0, `enabled` tinyint NOT NULL DEFAULT 1, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `templateId` int NOT NULL, UNIQUE INDEX `IDX_1fc4d0e7a18f2ce70514ed14bf` (`templateId`, `jackpotId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `tournament_jackpot_trigger` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `threshold` int NOT NULL, `jackpotId` int NOT NULL, `minLevel` int NOT NULL DEFAULT 0, `final` tinyint NOT NULL DEFAULT 0, `enabled` tinyint NOT NULL DEFAULT 1, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `tournamentId` int NOT NULL, UNIQUE INDEX `IDX_62adf6acef4959a6453d180d1c` (`tournamentId`, `jackpotId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template` ADD `contributionGroups` text NULL", undefined);
        await queryRunner.query("ALTER TABLE `tournament` ADD `contributionGroups` text NULL", undefined);
        await queryRunner.query("ALTER TABLE `wallet_entry` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'JackpotPayout', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase') NOT NULL", undefined);
        await queryRunner.query("ALTER TABLE `wallet_transaction` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'JackpotPayout', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase') NOT NULL", undefined);
        await queryRunner.query("ALTER TABLE `jackpot_adjustment` ADD CONSTRAINT `FK_18a883e27422be71a76806691f5` FOREIGN KEY (`jackpotId`) REFERENCES `jackpot`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `jackpot_payout` ADD CONSTRAINT `FK_a5a69bba60a6a574ece3efb7c6a` FOREIGN KEY (`jackpotId`) REFERENCES `jackpot`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `jackpot_payout` ADD CONSTRAINT `FK_6841bf44f9ece76fdbbfba4b10c` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `jackpot_payout` ADD CONSTRAINT `FK_93fc17769b5ae92d59b5fefe6bd` FOREIGN KEY (`walletEntryId`) REFERENCES `wallet_entry`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template_jackpot_trigger` ADD CONSTRAINT `FK_bfb4b3e3fde040d5f24f0207a8c` FOREIGN KEY (`jackpotId`) REFERENCES `jackpot`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template_jackpot_trigger` ADD CONSTRAINT `FK_efb212f474dd596ed1a54683a55` FOREIGN KEY (`templateId`) REFERENCES `tournament_template`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `tournament_jackpot_trigger` ADD CONSTRAINT `FK_8f958546d16186902e53b464656` FOREIGN KEY (`jackpotId`) REFERENCES `jackpot`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `tournament_jackpot_trigger` ADD CONSTRAINT `FK_adfa3c70cb66a9afae1f43c5b94` FOREIGN KEY (`tournamentId`) REFERENCES `tournament`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_jackpot_trigger` DROP FOREIGN KEY `FK_adfa3c70cb66a9afae1f43c5b94`", undefined);
        await queryRunner.query("ALTER TABLE `tournament_jackpot_trigger` DROP FOREIGN KEY `FK_8f958546d16186902e53b464656`", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template_jackpot_trigger` DROP FOREIGN KEY `FK_efb212f474dd596ed1a54683a55`", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template_jackpot_trigger` DROP FOREIGN KEY `FK_bfb4b3e3fde040d5f24f0207a8c`", undefined);
        await queryRunner.query("ALTER TABLE `jackpot_payout` DROP FOREIGN KEY `FK_93fc17769b5ae92d59b5fefe6bd`", undefined);
        await queryRunner.query("ALTER TABLE `jackpot_payout` DROP FOREIGN KEY `FK_6841bf44f9ece76fdbbfba4b10c`", undefined);
        await queryRunner.query("ALTER TABLE `jackpot_payout` DROP FOREIGN KEY `FK_a5a69bba60a6a574ece3efb7c6a`", undefined);
        await queryRunner.query("ALTER TABLE `jackpot_adjustment` DROP FOREIGN KEY `FK_18a883e27422be71a76806691f5`", undefined);
        await queryRunner.query("ALTER TABLE `wallet_transaction` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase') NOT NULL", undefined);
        await queryRunner.query("ALTER TABLE `wallet_entry` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase') NOT NULL", undefined);
        await queryRunner.query("ALTER TABLE `tournament` DROP COLUMN `contributionGroups`", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template` DROP COLUMN `contributionGroups`", undefined);
        await queryRunner.query("DROP INDEX `IDX_62adf6acef4959a6453d180d1c` ON `tournament_jackpot_trigger`", undefined);
        await queryRunner.query("DROP TABLE `tournament_jackpot_trigger`", undefined);
        await queryRunner.query("DROP INDEX `IDX_1fc4d0e7a18f2ce70514ed14bf` ON `tournament_template_jackpot_trigger`", undefined);
        await queryRunner.query("DROP TABLE `tournament_template_jackpot_trigger`", undefined);
        await queryRunner.query("DROP INDEX `REL_93fc17769b5ae92d59b5fefe6b` ON `jackpot_payout`", undefined);
        await queryRunner.query("DROP TABLE `jackpot_payout`", undefined);
        await queryRunner.query("DROP TABLE `jackpot_adjustment`", undefined);
        await queryRunner.query("DROP INDEX `IDX_c79760730093a92ba9304dd9f6` ON `jackpot`", undefined);
        await queryRunner.query("DROP TABLE `jackpot`", undefined);
    }

}
