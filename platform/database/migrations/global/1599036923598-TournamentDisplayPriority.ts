import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentDisplayPriority1599036923598 implements MigrationInterface {
    name = 'TournamentDisplayPriority1599036923598'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_template` ADD `displayPriority` int NOT NULL DEFAULT 0", undefined);
        await queryRunner.query("ALTER TABLE `tournament` ADD `displayPriority` int NOT NULL DEFAULT 0", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament` DROP COLUMN `displayPriority`", undefined);
        await queryRunner.query("ALTER TABLE `tournament_template` DROP COLUMN `displayPriority`", undefined);
    }

}
