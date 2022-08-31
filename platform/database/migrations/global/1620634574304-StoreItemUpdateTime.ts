import {MigrationInterface, QueryRunner} from "typeorm";

export class StoreItemUpdateTime1620634574304 implements MigrationInterface {
    name = 'StoreItemUpdateTime1620634574304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `store_item` ADD `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `store_item` DROP COLUMN `updateTime`");
    }

}
