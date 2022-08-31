import {MigrationInterface, QueryRunner} from "typeorm";

export class UserHasPaymentMethod1619170662195 implements MigrationInterface {
    name = 'UserHasPaymentMethod1619170662195'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` ADD `hasPaymentMethod` tinyint NOT NULL DEFAULT 0");
        await queryRunner.query("UPDATE `user` INNER JOIN `payment_method` ON `payment_method`.`userId` = `user`.`id` SET `hasPaymentMethod` = 1");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `hasPaymentMethod`");
    }

}
