import {MigrationInterface, QueryRunner} from "typeorm";

export class UserRegCountryState1611231739464 implements MigrationInterface {
    name = 'UserRegCountryState1611231739464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` ADD `regCountry` varchar(2) NULL");
        await queryRunner.query("ALTER TABLE `user` ADD `regState` varchar(3) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `regState`");
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `regCountry`");
    }

}
