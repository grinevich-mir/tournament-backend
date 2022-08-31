import {MigrationInterface, QueryRunner} from "typeorm";

export class UserIpInfoCleanup1601648373341 implements MigrationInterface {
    name = 'UserIpInfoCleanup1601648373341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user_ip` DROP COLUMN `timeZone`", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` DROP COLUMN `metroCode`", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` ADD `regionCode` varchar(255) NULL", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` DROP COLUMN `latitude`", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` ADD `latitude` decimal(19,16) NULL", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` DROP COLUMN `longitude`", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` ADD `longitude` decimal(19,16) NULL", undefined);
        await queryRunner.query("CREATE INDEX `IDX_0e1fc4aa92982c0841497807aa` ON `user_ip` (`ipAddress`)", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_0e1fc4aa92982c0841497807aa` ON `user_ip`", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` DROP COLUMN `longitude`", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` ADD `longitude` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` DROP COLUMN `latitude`", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` ADD `latitude` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` DROP COLUMN `regionCode`", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` ADD `metroCode` int NULL", undefined);
        await queryRunner.query("ALTER TABLE `user_ip` ADD `timeZone` varchar(255) NULL", undefined);
    }

}
