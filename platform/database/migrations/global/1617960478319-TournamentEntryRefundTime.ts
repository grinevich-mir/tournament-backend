import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentEntryRefundTime1617960478319 implements MigrationInterface {
    name = 'TournamentEntryRefundTime1617960478319'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_entry` ADD `refundTime` datetime NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_entry` DROP COLUMN `refundTime`");
    }

}
