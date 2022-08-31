import {MigrationInterface, QueryRunner} from "typeorm";

export class WithdrawalRequestProviderRef1599052279739 implements MigrationInterface {
    name = 'WithdrawalRequestProviderRef1599052279739'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `withdrawal_request` ADD `providerRef` varchar(255) NULL", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `withdrawal_request` DROP COLUMN `providerRef`", undefined);
    }

}
