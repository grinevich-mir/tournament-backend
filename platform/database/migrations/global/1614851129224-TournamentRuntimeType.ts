import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentRuntimeType1614851129224 implements MigrationInterface {
    name = 'TournamentRuntimeType1614851129224'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_template` ADD `runtime` enum ('Fargate', 'StepFunction') NOT NULL DEFAULT 'Fargate'");
        await queryRunner.query("ALTER TABLE `tournament` ADD `runtime` enum ('Fargate', 'StepFunction') NOT NULL DEFAULT 'Fargate'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament` DROP COLUMN `runtime`");
        await queryRunner.query("ALTER TABLE `tournament_template` DROP COLUMN `runtime`");
    }

}
