import { MigrationInterface, QueryRunner } from "typeorm";

export class Store11619701866870 implements MigrationInterface {
    name = 'Store11619701866870'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `store_item` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `price` decimal(16,4) NOT NULL, `quantity` int NOT NULL, `minLevel` int NOT NULL, `maxLevel` int NOT NULL, `tag` varchar(255) NOT NULL, `priority` int, `imageUrl` varchar(255), `type` enum ('Diamonds') NOT NULL, `enabled` tinyint NOT NULL DEFAULT 1, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE `store_item`");
    }

}
