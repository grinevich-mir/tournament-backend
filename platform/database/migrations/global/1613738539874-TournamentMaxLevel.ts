import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentMaxLevel1613738539874 implements MigrationInterface {
    name = 'TournamentMaxLevel1613738539874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_template` ADD `maxLevel` int NULL");
        await queryRunner.query("ALTER TABLE `tournament` ADD `maxLevel` int NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_template` DROP COLUMN `maxLevel`");
        await queryRunner.query("ALTER TABLE `tournament` DROP COLUMN `maxLevel`");
    }

}
