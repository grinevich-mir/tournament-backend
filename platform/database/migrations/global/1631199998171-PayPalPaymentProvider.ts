import { MigrationInterface, QueryRunner } from "typeorm";

export class PayPalPaymentProvider1631199998171 implements MigrationInterface {
    name = 'PayPalPaymentProvider1631199998171'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_option` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal') NOT NULL");
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly', 'PayPal') NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_option` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas', 'Trustly') NOT NULL");
    }
}