import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentChatChannel1611077215737 implements MigrationInterface {
    name = 'TournamentChatChannel1611077215737'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_template` ADD `chatChannel` varchar(50) NULL");
        await queryRunner.query("ALTER TABLE `tournament` ADD `chatChannel` varchar(50) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament` DROP COLUMN `chatChannel`");
        await queryRunner.query("ALTER TABLE `tournament_template` DROP COLUMN `chatChannel`");
    }

}
