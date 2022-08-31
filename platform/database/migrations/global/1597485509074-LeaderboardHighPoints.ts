import {MigrationInterface, QueryRunner} from "typeorm";

export class LeaderboardHighPoints1597485509074 implements MigrationInterface {
    name = 'LeaderboardHighPoints1597485509074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `leaderboard_entry` ADD `tieBreaker` int NOT NULL DEFAULT 0", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_entry` ADD `runningPoints` int NOT NULL DEFAULT 0", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_entry` ADD `runningTieBreaker` int NOT NULL DEFAULT 0", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template` ADD `leaderboardPointMode` enum ('Cumulative', 'Highest') NOT NULL DEFAULT 'Cumulative'", undefined);
        await queryRunner.query("ALTER TABLE `tournament` ADD `leaderboardPointMode` enum ('Cumulative', 'Highest') NOT NULL DEFAULT 'Cumulative'", undefined);
        await queryRunner.query("UPDATE `leaderboard_entry` SET runningPoints = points", undefined);
        await queryRunner.query("UPDATE `leaderboard_entry` SET tieBreaker = 2147483647 - `rank`, runningTieBreaker = tieBreaker WHERE `rank` IS NOT NULL", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament` DROP COLUMN `leaderboardPointMode`", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template` DROP COLUMN `leaderboardPointMode`", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_entry` DROP COLUMN `runningTieBreaker`", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_entry` DROP COLUMN `runningPoints`", undefined);
        await queryRunner.query("ALTER TABLE `leaderboard_entry` DROP COLUMN `tieBreaker`", undefined);
    }

}
