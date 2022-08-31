import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentPrizeCashAlternative1626770739076 implements MigrationInterface {
    name = 'TournamentPrizeCashAlternative1626770739076'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_template_prize` ADD `cashAlternativeAmount` decimal(16,4) NULL");
        await queryRunner.query("ALTER TABLE `tournament_prize` ADD `cashAlternativeAmount` decimal(16,4) NULL");
        await queryRunner.query("ALTER TABLE `tournament_entry_prize` ADD `cashAlternativeAmount` decimal(16,4) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_entry_prize` DROP COLUMN `cashAlternativeAmount`");
        await queryRunner.query("ALTER TABLE `tournament_prize` DROP COLUMN `cashAlternativeAmount`");
        await queryRunner.query("ALTER TABLE `tournament_template_prize` DROP COLUMN `cashAlternativeAmount`");
    }

}
