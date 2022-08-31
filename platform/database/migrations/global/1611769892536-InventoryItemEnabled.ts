import {MigrationInterface, QueryRunner} from "typeorm";

export class InventoryItemEnabled1611769892536 implements MigrationInterface {
    name = 'InventoryItemEnabled1611769892536'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `inventory_item` ADD `enabled` tinyint NOT NULL DEFAULT 1");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `inventory_item` DROP COLUMN `enabled`");
    }

}
