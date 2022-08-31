import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentGrouping1599489109637 implements MigrationInterface {
    name = 'TournamentGrouping1599489109637'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_template` ADD `group` varchar(20) NULL", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template` ADD `tags` text NULL", undefined);
        await queryRunner.query("ALTER TABLE `tournament` ADD `group` varchar(20) NULL", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament` DROP COLUMN `group`", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template` DROP COLUMN `tags`", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template` DROP COLUMN `group`", undefined);
    }

}
