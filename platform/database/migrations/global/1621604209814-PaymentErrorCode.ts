import {MigrationInterface, QueryRunner} from "typeorm";

export class PaymentErrorCode1621604209814 implements MigrationInterface {
    name = 'PaymentErrorCode1621604209814'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment` ADD `errorCode` varchar(50) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment` DROP COLUMN `errorCode`");
    }

}
