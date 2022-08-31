import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentMaxEntryAllocations1613411880686 implements MigrationInterface {
    name = 'TournamentMaxEntryAllocations1613411880686'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_template` ADD `maxEntryAllocations` int NULL DEFAULT 1");
        await queryRunner.query("ALTER TABLE `tournament` ADD `maxEntryAllocations` int NULL DEFAULT 1");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament` DROP COLUMN `maxEntryAllocations`");
        await queryRunner.query("ALTER TABLE `tournament_template` DROP COLUMN `maxEntryAllocations`");
    }

}
