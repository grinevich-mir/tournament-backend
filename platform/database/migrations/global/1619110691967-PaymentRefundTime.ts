import {MigrationInterface, QueryRunner} from "typeorm";

export class PaymentRefundTime1619110691967 implements MigrationInterface {
    name = 'PaymentRefundTime1619110691967'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment` ADD `refundTime` datetime NULL");
        await queryRunner.query("UPDATE `payment` SET `refundTime` = `updateTime` WHERE `status` = 'Refunded'");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment` DROP COLUMN `refundTime`");
    }

}
