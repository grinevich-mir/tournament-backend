import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentTemplatePrizes1626701585310 implements MigrationInterface {
    name = 'TournamentTemplatePrizes1626701585310'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_template_prize` ADD `name` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `tournament_template_prize` ADD `shortName` varchar(10) NULL");
        await queryRunner.query("ALTER TABLE `tournament_template_prize` ADD `imageUrl` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_template_prize` DROP COLUMN `imageUrl`");
        await queryRunner.query("ALTER TABLE `tournament_template_prize` DROP COLUMN `shortName`");
        await queryRunner.query("ALTER TABLE `tournament_template_prize` DROP COLUMN `name`");
    }

}
