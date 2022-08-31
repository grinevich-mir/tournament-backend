import {MigrationInterface, QueryRunner} from "typeorm";

export class ScheduledLeaderboards1597924484555 implements MigrationInterface {
    name = 'ScheduledLeaderboards1597924484555'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `leaderboard_schedule_prize` (`id` int NOT NULL AUTO_INCREMENT, `startRank` int NOT NULL, `endRank` int NOT NULL, `type` enum ('Cash', 'Tangible', 'Upgrade') NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `scheduleName` varchar(50) NOT NULL, `currencyCode` varchar(3) NULL, `amount` decimal(10,4) NULL, `level` int NULL, `duration` int NULL, INDEX `IDX_cace4ed2a9ae6b166ccb87e062` (`type`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `leaderboard_schedule` (`name` varchar(50) NOT NULL, `frequency` enum ('Daily', 'Weekly', 'Monthly', 'Annually') NOT NULL, `offset` int NOT NULL DEFAULT 0, `pointConfig` text NULL, `minLevel` int NOT NULL DEFAULT 0, `autoPayout` tinyint NOT NULL DEFAULT 1, `enabled` tinyint NOT NULL DEFAULT 1, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`name`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `leaderboard_schedule_item` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `scheduleName` varchar(50) NOT NULL, `frequency` varchar(255) NOT NULL, `leaderboardId` int(10) UNSIGNED NOT NULL, `minLevel` int NOT NULL DEFAULT 0, `startTime` datetime NOT NULL, `endTime` datetime NOT NULL, `autoPayout` tinyint NOT NULL DEFAULT 1, `enabled` tinyint NOT NULL DEFAULT 1, `finalised` tinyint NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX `IDX_176bb6a90eba2a3f5b90fb1443` (`frequency`), INDEX `IDX_8c571550b19d213f5131d6df52` (`enabled`), INDEX `IDX_800fd885fa03374cde4631d6bc` (`startTime`, `endTime`), UNIQUE INDEX `REL_c24e04cdacbbcd792f25c81f8b` (`leaderboardId`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard` CHANGE `type` `type` enum ('Global', 'Scheduled', 'Tournament') NOT NULL", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` ADD CONSTRAINT `FK_881f8f6e369deae7e529889cb80` FOREIGN KEY (`scheduleName`) REFERENCES `leaderboard_schedule`(`name`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` ADD CONSTRAINT `FK_3b370632c794f5b8c31f90ac3c4` FOREIGN KEY (`currencyCode`) REFERENCES `currency`(`code`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_item` ADD CONSTRAINT `FK_b930e61c1698ed568d669a00933` FOREIGN KEY (`scheduleName`) REFERENCES `leaderboard_schedule`(`name`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_item` ADD CONSTRAINT `FK_c24e04cdacbbcd792f25c81f8b1` FOREIGN KEY (`leaderboardId`) REFERENCES `leaderboard`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_item` DROP FOREIGN KEY `FK_c24e04cdacbbcd792f25c81f8b1`", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_item` DROP FOREIGN KEY `FK_b930e61c1698ed568d669a00933`", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` DROP FOREIGN KEY `FK_3b370632c794f5b8c31f90ac3c4`", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` DROP FOREIGN KEY `FK_881f8f6e369deae7e529889cb80`", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard` CHANGE `type` `type` enum ('Global', 'Tournament') NOT NULL", undefined);
        await queryRunner.query("DROP INDEX `REL_c24e04cdacbbcd792f25c81f8b` ON `leaderboard_schedule_item`", undefined);
        await queryRunner.query("DROP INDEX `IDX_800fd885fa03374cde4631d6bc` ON `leaderboard_schedule_item`", undefined);
        await queryRunner.query("DROP INDEX `IDX_8c571550b19d213f5131d6df52` ON `leaderboard_schedule_item`", undefined);
        await queryRunner.query("DROP INDEX `IDX_176bb6a90eba2a3f5b90fb1443` ON `leaderboard_schedule_item`", undefined);
        await queryRunner.query("DROP TABLE `leaderboard_schedule_item`", undefined);
        await queryRunner.query("DROP TABLE `leaderboard_schedule`", undefined);
        await queryRunner.query("DROP INDEX `IDX_cace4ed2a9ae6b166ccb87e062` ON `leaderboard_schedule_prize`", undefined);
        await queryRunner.query("DROP TABLE `leaderboard_schedule_prize`", undefined);
    }

}
