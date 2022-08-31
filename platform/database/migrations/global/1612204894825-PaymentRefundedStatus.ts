import {MigrationInterface, QueryRunner} from "typeorm";

export class PaymentRefundedStatus1612204894825 implements MigrationInterface {
    name = 'PaymentRefundedStatus1612204894825'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment` CHANGE `status` `status` enum ('Pending', 'Successful', 'Declined', 'Voided', 'Refunded') NOT NULL DEFAULT 'Pending'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment` CHANGE `status` `status` enum ('Pending', 'Successful', 'Declined', 'Voided') NOT NULL DEFAULT 'Pending'");
    }

}
