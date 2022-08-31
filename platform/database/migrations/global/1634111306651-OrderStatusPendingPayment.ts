import { MigrationInterface, QueryRunner } from "typeorm";

export class OrderStatusPendingPayment1634111306651 implements MigrationInterface {
    name = 'OrderStatusPendingPayment1634111306651'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `order` CHANGE `status` `status` enum ('Pending', 'Paid', 'Complete', 'Expired', 'PendingPayment') NOT NULL DEFAULT 'Pending'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `order` CHANGE `status` `status` enum ('Pending', 'Paid', 'Complete', 'Expired') NOT NULL DEFAULT 'Pending'");
    }
}
