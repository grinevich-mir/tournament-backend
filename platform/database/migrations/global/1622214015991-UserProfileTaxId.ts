import {MigrationInterface, QueryRunner} from "typeorm";

export class UserProfileTaxId1622214015991 implements MigrationInterface {
    name = 'UserProfileTaxId1622214015991'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user_profile` ADD `taxId` varchar(100) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user_profile` DROP COLUMN `taxId`");
    }

}
