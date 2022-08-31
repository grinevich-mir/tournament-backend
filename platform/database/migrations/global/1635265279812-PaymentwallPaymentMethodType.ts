import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentwallPaymentMethodType1635265279812 implements MigrationInterface {
    name = 'PaymentwallPaymentMethodType1635265279812'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `type` `type` enum ('CreditCard', 'BankAccount', 'Giropay', 'PayPal', 'Paysafecard', 'Skrill', 'Paymentwall') NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `type` `type` enum ('CreditCard', 'BankAccount', 'Giropay', 'PayPal', 'Paysafecard', 'Skrill') NOT NULL");
    }
}
