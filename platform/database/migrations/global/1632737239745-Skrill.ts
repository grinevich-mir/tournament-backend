import { MigrationInterface, QueryRunner } from "typeorm";

export class Skrill1632737239745 implements MigrationInterface {
    name = 'Skrill1632737239745'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `type` `type` enum ('CreditCard', 'BankAccount', 'Giropay', 'PayPal', 'Paysafecard', 'Skrill') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_option` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill') NOT NULL");
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill') NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_option` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `type` `type` enum ('CreditCard', 'BankAccount', 'Giropay', 'PayPal', 'Paysafecard') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal') NOT NULL");
    }
}
