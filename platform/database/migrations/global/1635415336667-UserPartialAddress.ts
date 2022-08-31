import {MigrationInterface, QueryRunner} from "typeorm";

export class UserPartialAddress1635415336667 implements MigrationInterface {
    name = 'UserPartialAddress1635415336667'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` CHANGE `addressStatus` `addressStatus` enum ('Pending', 'Partial', 'Complete') NOT NULL DEFAULT 'Pending'");
        await queryRunner.query("ALTER TABLE `user_address` CHANGE `line1` `line1` varchar(255) NULL");
        await queryRunner.query("ALTER TABLE `user_address` CHANGE `city` `city` varchar(255) NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user_address` CHANGE `line1` `line1` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `user_address` CHANGE `city` `city` varchar(255) NOT NULL");
        await queryRunner.query("ALTER TABLE `user` CHANGE `addressStatus` `addressStatus` enum ('Pending', 'Complete') NOT NULL DEFAULT 'Pending'");
    }

}
