import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentwallPaymentProvider1635160263996 implements MigrationInterface {
    name = 'PaymentwallPaymentProvider1635160263996'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill', 'Paymentwall') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill', 'Paymentwall') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_option` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill', 'Paymentwall') NOT NULL");
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill', 'Paymentwall') NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_option` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal', 'Skrill') NOT NULL");
    }
}
