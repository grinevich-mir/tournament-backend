import {MigrationInterface, QueryRunner} from "typeorm";

export class LeaderboardPrizes1626699772041 implements MigrationInterface {
    name = 'LeaderboardPrizes1626699772041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `leaderboard_prize` ADD `name` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `leaderboard_prize` ADD `shortName` varchar(10) NULL");
        await queryRunner.query("ALTER TABLE `leaderboard_prize` ADD `imageUrl` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `leaderboard_prize` DROP COLUMN `imageUrl`");
        await queryRunner.query("ALTER TABLE `leaderboard_prize` DROP COLUMN `shortName`");
        await queryRunner.query("ALTER TABLE `leaderboard_prize` DROP COLUMN `name`");
    }

}
