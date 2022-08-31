import {MigrationInterface, QueryRunner} from "typeorm";

export class BankAccountPaymentMethodNameId1620975428854 implements MigrationInterface {
    name = 'BankAccountPaymentMethodNameId1620975428854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_method` ADD `name` varchar(50) NULL");
        await queryRunner.query("ALTER TABLE `payment_method` ADD `bankName` varchar(50) NULL");
        await queryRunner.query("ALTER TABLE `payment_method` ADD `bankId` varchar(50) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_method` DROP COLUMN `bankId`");
        await queryRunner.query("ALTER TABLE `payment_method` DROP COLUMN `bankName`");
        await queryRunner.query("ALTER TABLE `payment_method` DROP COLUMN `name`");
    }

}
