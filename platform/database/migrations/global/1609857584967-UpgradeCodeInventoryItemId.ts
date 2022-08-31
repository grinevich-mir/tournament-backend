import {MigrationInterface, QueryRunner} from "typeorm";

export class UpgradeCodeInventoryItemId1609857584967 implements MigrationInterface {
    name = 'UpgradeCodeInventoryItemId1609857584967'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upgrade_code` ADD `inventoryItemId` int NULL");
        await queryRunner.query("ALTER TABLE `upgrade_code` ADD UNIQUE INDEX `IDX_d82a0524f020da18fa2d793eb3` (`inventoryItemId`)");
        await queryRunner.query("CREATE UNIQUE INDEX `REL_d82a0524f020da18fa2d793eb3` ON `upgrade_code` (`inventoryItemId`)");
        await queryRunner.query("ALTER TABLE `upgrade_code` ADD CONSTRAINT `FK_d82a0524f020da18fa2d793eb32` FOREIGN KEY (`inventoryItemId`) REFERENCES `inventory_item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upgrade_code` DROP FOREIGN KEY `FK_d82a0524f020da18fa2d793eb32`");
        await queryRunner.query("DROP INDEX `REL_d82a0524f020da18fa2d793eb3` ON `upgrade_code`");
        await queryRunner.query("ALTER TABLE `upgrade_code` DROP INDEX `IDX_d82a0524f020da18fa2d793eb3`");
        await queryRunner.query("ALTER TABLE `upgrade_code` DROP COLUMN `inventoryItemId`");
    }

}
