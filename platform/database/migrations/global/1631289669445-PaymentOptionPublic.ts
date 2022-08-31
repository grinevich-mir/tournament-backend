import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentOptionPublic1631289669445 implements MigrationInterface {
    name = 'PaymentOptionPublic1631289669445'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_method` ADD `email` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `payment_option` ADD `public` tinyint NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_option` DROP COLUMN `public`");
        await queryRunner.query("ALTER TABLE `payment_method` DROP COLUMN `email`");
    }
}