import {MigrationInterface, QueryRunner} from "typeorm";

export class LeaderboardPrizeCashAlternative1626771694668 implements MigrationInterface {
    name = 'LeaderboardPrizeCashAlternative1626771694668'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `leaderboard_prize` ADD `cashAlternativeAmount` decimal(16,4) NULL");
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` ADD `cashAlternativeAmount` decimal(16,4) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `leaderboard_schedule_prize` DROP COLUMN `cashAlternativeAmount`");
        await queryRunner.query("ALTER TABLE `leaderboard_prize` DROP COLUMN `cashAlternativeAmount`");
    }

}
