import {MigrationInterface, QueryRunner} from "typeorm";

export class UpgradeCodeDiamonds1618498021369 implements MigrationInterface {
    name = 'UpgradeCodeDiamonds1618498021369'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upgrade_code` DROP FOREIGN KEY `FK_d82a0524f020da18fa2d793eb32`");
        await queryRunner.query("DROP INDEX `IDX_d82a0524f020da18fa2d793eb3` ON `upgrade_code`");
        await queryRunner.query("DROP INDEX `REL_d82a0524f020da18fa2d793eb3` ON `upgrade_code`");
        await queryRunner.query("CREATE TABLE `upgrade_code_inventory_item` (`upgradeCodeCode` varchar(16) NOT NULL, `inventoryItemId` int NOT NULL, INDEX `IDX_e000135df69b9debc5828e8e49` (`upgradeCodeCode`), INDEX `IDX_ed73bcdf63684dd29b9b1e473d` (`inventoryItemId`), PRIMARY KEY (`upgradeCodeCode`, `inventoryItemId`)) ENGINE=InnoDB");
        await queryRunner.query("INSERT INTO `upgrade_code_inventory_item` (upgradeCodeCode, inventoryItemId) SELECT `code`, `inventoryItemId` FROM `upgrade_code` WHERE `upgrade_code`.`inventoryItemId` IS NOT NULL");
        await queryRunner.query("ALTER TABLE `upgrade_code` CHANGE `inventoryItemId` `diamonds` int NULL");
        await queryRunner.query("ALTER TABLE `upgrade_config` ADD `codeDiamonds` int NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `upgrade_code` CHANGE `diamonds` `diamonds` int NOT NULL DEFAULT 0");
        await queryRunner.query("UPDATE `upgrade_code` SET `diamonds` = 0");
        await queryRunner.query("ALTER TABLE `upgrade_code_inventory_item` ADD CONSTRAINT `FK_e000135df69b9debc5828e8e49e` FOREIGN KEY (`upgradeCodeCode`) REFERENCES `upgrade_code`(`code`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `upgrade_code_inventory_item` ADD CONSTRAINT `FK_ed73bcdf63684dd29b9b1e473d0` FOREIGN KEY (`inventoryItemId`) REFERENCES `inventory_item`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `upgrade_code_inventory_item` DROP FOREIGN KEY `FK_ed73bcdf63684dd29b9b1e473d0`");
        await queryRunner.query("ALTER TABLE `upgrade_code_inventory_item` DROP FOREIGN KEY `FK_e000135df69b9debc5828e8e49e`");
        await queryRunner.query("ALTER TABLE `upgrade_code` CHANGE `diamonds` `diamonds` int NULL");
        await queryRunner.query("ALTER TABLE `upgrade_config` DROP COLUMN `codeDiamonds`");
        await queryRunner.query("DROP INDEX `IDX_ed73bcdf63684dd29b9b1e473d` ON `upgrade_code_inventory_item`");
        await queryRunner.query("DROP INDEX `IDX_e000135df69b9debc5828e8e49` ON `upgrade_code_inventory_item`");
        await queryRunner.query("ALTER TABLE `upgrade_code` CHANGE `diamonds` `inventoryItemId` int NULL");
        await queryRunner.query("UPDATE `upgrade_code` INNER JOIN `upgrade_code_inventory_item` ON `upgrade_code_inventory_item`.`upgradeCodeCode` = `upgrade_code`.`code` SET `upgrade_code`.`inventoryItemId` = `upgrade_code_inventory_item`.`inventoryItemId`");
        await queryRunner.query("DROP TABLE `upgrade_code_inventory_item`");
        await queryRunner.query("CREATE UNIQUE INDEX `REL_d82a0524f020da18fa2d793eb3` ON `upgrade_code` (`inventoryItemId`)");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_d82a0524f020da18fa2d793eb3` ON `upgrade_code` (`inventoryItemId`)");
        await queryRunner.query("ALTER TABLE `upgrade_code` ADD CONSTRAINT `FK_d82a0524f020da18fa2d793eb32` FOREIGN KEY (`inventoryItemId`) REFERENCES `inventory_item`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

}
