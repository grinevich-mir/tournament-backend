import {MigrationInterface, QueryRunner} from "typeorm";

export class InventoryClaimedTime1610099561831 implements MigrationInterface {
    name = 'InventoryClaimedTime1610099561831'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `inventory_item` ADD `claimedTime` datetime NULL");
        await queryRunner.query("UPDATE `inventory_item` SET claimedTime = createTime WHERE claimed = 1");
        await queryRunner.query("ALTER TABLE `inventory_item` DROP COLUMN `claimed`");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `inventory_item` ADD `claimed` tinyint NOT NULL DEFAULT '0'");
        await queryRunner.query("UPDATE `inventory_item` SET claimed = 1 WHERE claimedTime IS NOT NULL");
        await queryRunner.query("ALTER TABLE `inventory_item` DROP COLUMN `claimedTime`");
    }

}
