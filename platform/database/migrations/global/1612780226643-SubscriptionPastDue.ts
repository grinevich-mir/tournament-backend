import {MigrationInterface, QueryRunner} from "typeorm";

export class SubscriptionPastDue1612780226643 implements MigrationInterface {
    name = 'SubscriptionPastDue1612780226643'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `status` `status` enum ('Pending', 'Active', 'Paused', 'PastDue', 'Cancelled', 'Expired') NOT NULL DEFAULT 'Pending'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `status` `status` enum ('Pending', 'Active', 'Paused', 'Cancelled', 'Expired') NOT NULL DEFAULT 'Pending'");
    }

}
