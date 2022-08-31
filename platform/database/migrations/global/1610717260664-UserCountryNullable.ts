import {MigrationInterface, QueryRunner} from "typeorm";

export class UserCountryNullable1610717260664 implements MigrationInterface {
    name = 'UserCountryNullable1610717260664'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` CHANGE `country` `country` varchar(2) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` CHANGE `country` `country` varchar(2) NOT NULL");
    }

}
