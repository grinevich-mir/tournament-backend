import {MigrationInterface, QueryRunner} from "typeorm";

export class UserBTag1610990446973 implements MigrationInterface {
    name = 'UserBTag1610990446973'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` ADD `bTag` varchar(255) NULL");
        await queryRunner.query("CREATE INDEX `IDX_1c04093f33ba6a36c9b8a3ed92` ON `user` (`bTag`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_1c04093f33ba6a36c9b8a3ed92` ON `user`");
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `bTag`");
    }

}
