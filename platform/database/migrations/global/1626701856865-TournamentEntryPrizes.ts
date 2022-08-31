import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentEntryPrizes1626701856865 implements MigrationInterface {
    name = 'TournamentEntryPrizes1626701856865'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_entry_prize` ADD `name` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `tournament_entry_prize` ADD `shortName` varchar(10) NULL");
        await queryRunner.query("ALTER TABLE `tournament_entry_prize` ADD `imageUrl` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_entry_prize` DROP COLUMN `imageUrl`");
        await queryRunner.query("ALTER TABLE `tournament_entry_prize` DROP COLUMN `shortName`");
        await queryRunner.query("ALTER TABLE `tournament_entry_prize` DROP COLUMN `name`");
    }

}
