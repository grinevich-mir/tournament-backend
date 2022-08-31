import {MigrationInterface, QueryRunner} from "typeorm";

export class LeaderboardSchedulePrizes1626701115901 implements MigrationInterface {
    name = 'LeaderboardSchedulePrizes1626701115901'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` ADD `name` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` ADD `shortName` varchar(10) NULL");
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` ADD `imageUrl` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` DROP COLUMN `imageUrl`");
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` DROP COLUMN `shortName`");
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` DROP COLUMN `name`");
    }

}
