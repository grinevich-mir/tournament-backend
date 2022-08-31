import {MigrationInterface, QueryRunner} from "typeorm";

export class UserMetadata1632906269543 implements MigrationInterface {
    name = 'UserMetadata1632906269543'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` ADD `metadata` text NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `metadata`");
    }

}
