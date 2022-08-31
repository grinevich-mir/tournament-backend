import {MigrationInterface, QueryRunner} from "typeorm";

export class UserClickId1638348380837 implements MigrationInterface {
    name = 'UserClickId1638348380837'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` ADD `clickId` varchar(100) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `clickId`");
    }

}
