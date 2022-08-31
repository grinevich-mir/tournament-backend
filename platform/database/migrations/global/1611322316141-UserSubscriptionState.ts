import {MigrationInterface, QueryRunner} from "typeorm";

export class UserSubscriptionState1611322316141 implements MigrationInterface {
    name = 'UserSubscriptionState1611322316141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` ADD `subscribed` tinyint NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `user` ADD `subscribing` tinyint NOT NULL DEFAULT 0");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `subscribing`");
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `subscribed`");
    }

}
