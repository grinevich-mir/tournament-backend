import {MigrationInterface, QueryRunner} from "typeorm";

export class NewPaymentMethods1619173065688 implements MigrationInterface {
    name = 'NewPaymentMethods1619173065688'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `type` `type` enum ('CreditCard', 'BankAccount', 'Giropay', 'PayPal', 'Paysafecard') NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `type` `type` enum ('CreditCard', 'BankAccount') NOT NULL");
    }

}
