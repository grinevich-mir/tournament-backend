import { MigrationInterface, QueryRunner } from "typeorm";

export class PublicStore1631708495140 implements MigrationInterface {
    name = 'PublicStore1631708495140'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `store_item` ADD `public` tinyint NOT NULL DEFAULT 1");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `store_item` DROP COLUMN `public`");
    }

}
