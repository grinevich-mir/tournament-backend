import {MigrationInterface, QueryRunner} from "typeorm";

export class DiamondInventoryItem1618500897394 implements MigrationInterface {
    name = 'DiamondInventoryItem1618500897394'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `inventory_item` CHANGE `type` `type` enum ('Upgrade', 'Diamonds') NOT NULL");
        await queryRunner.query("ALTER TABLE `inventory_item` ADD `amount` int NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `inventory_item` DROP COLUMN `amount`");
        await queryRunner.query("ALTER TABLE `inventory_item` CHANGE `type` `type` enum ('Upgrade') NOT NULL");
    }

}
