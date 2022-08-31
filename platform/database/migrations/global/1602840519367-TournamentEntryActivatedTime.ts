import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentEntryActivatedTime1602840519367 implements MigrationInterface {
    name = 'TournamentEntryActivatedTime1602840519367'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_entry` ADD `activatedTime` datetime NULL", undefined);
        await queryRunner.query("UPDATE `tournament_entry` SET `activatedTime` = createTime", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_entry` DROP COLUMN `activatedTime`", undefined);
    }

}
