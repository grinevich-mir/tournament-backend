import {MigrationInterface, QueryRunner} from "typeorm";

export class GameBonuses1607355866593 implements MigrationInterface {
    name = 'GameBonuses1607355866593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `game_bonus` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `userId` int NOT NULL, `gameId` int NOT NULL, `reference` varchar(36) NULL, `providerId` int NOT NULL, `providerRef` varchar(50) NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX `IDX_34fae4b438dec5bd64422919e1` (`reference`), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `game_session` ADD `reference` varchar(36) NULL");
        await queryRunner.query("CREATE INDEX `IDX_3dcbb7032d66bd4b3ba8f27a47` ON `game_session` (`reference`)");
        await queryRunner.query("ALTER TABLE `game_bonus` ADD CONSTRAINT `FK_b7ccf5c22053728b02c5ca81b3a` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `game_bonus` ADD CONSTRAINT `FK_9c468f9045bdfd62efb5ec1dbba` FOREIGN KEY (`gameId`) REFERENCES `game`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `game_bonus` ADD CONSTRAINT `FK_0983f4f2392318196a504bc75dd` FOREIGN KEY (`providerId`) REFERENCES `game_provider`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `game_bonus` DROP FOREIGN KEY `FK_0983f4f2392318196a504bc75dd`");
        await queryRunner.query("ALTER TABLE `game_bonus` DROP FOREIGN KEY `FK_9c468f9045bdfd62efb5ec1dbba`");
        await queryRunner.query("ALTER TABLE `game_bonus` DROP FOREIGN KEY `FK_b7ccf5c22053728b02c5ca81b3a`");
        await queryRunner.query("DROP INDEX `IDX_3dcbb7032d66bd4b3ba8f27a47` ON `game_session`");
        await queryRunner.query("ALTER TABLE `game_session` DROP COLUMN `reference`");
        await queryRunner.query("DROP INDEX `IDX_34fae4b438dec5bd64422919e1` ON `game_bonus`");
        await queryRunner.query("DROP TABLE `game_bonus`");
    }

}
