import {MigrationInterface, QueryRunner} from "typeorm";

export class WithdrawalRequestProvider1598542537449 implements MigrationInterface {
    name = 'WithdrawalRequestProvider1598542537449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `withdrawal_request` ADD `provider` enum ('PayPal') NOT NULL DEFAULT 'PayPal'", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `withdrawal_request` DROP COLUMN `provider`", undefined);
    }
}
