import {MigrationInterface, QueryRunner} from "typeorm";

export class PaymentMethodMetadata1620838951976 implements MigrationInterface {
    name = 'PaymentMethodMetadata1620838951976'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_method` ADD `metadata` text NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_method` DROP COLUMN `metadata`");
    }

}
