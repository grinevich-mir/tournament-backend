import {MigrationInterface, QueryRunner} from "typeorm";

export class InventoryItemExpiryNullable1610038384492 implements MigrationInterface {
    name = 'InventoryItemExpiryNullable1610038384492'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `inventory_item` CHANGE `expires` `expires` datetime NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `inventory_item` CHANGE `expires` `expires` datetime NOT NULL");
    }

}
