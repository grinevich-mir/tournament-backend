import {MigrationInterface, QueryRunner} from "typeorm";

export class JackpotAdjustmentBalance1603963754960 implements MigrationInterface {
    name = 'JackpotAdjustmentBalance1603963754960'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `jackpot_adjustment` ADD `balance` decimal(10,4) NOT NULL", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `jackpot_adjustment` DROP COLUMN `balance`", undefined);
    }

}
