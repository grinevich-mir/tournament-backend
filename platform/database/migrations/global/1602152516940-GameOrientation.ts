import {MigrationInterface, QueryRunner} from "typeorm";

export class GameOrientation1602152516940 implements MigrationInterface {
    name = 'GameOrientation1602152516940'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `game` ADD `orientation` enum ('All', 'Landscape', 'Portrait') NOT NULL DEFAULT 'Portrait'", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `game` DROP COLUMN `orientation`", undefined);
    }

}
