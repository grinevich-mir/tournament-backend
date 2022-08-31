import {MigrationInterface, QueryRunner} from "typeorm";

export class Notifications1610099562835 implements MigrationInterface {
    name = 'Notifications1610099562835'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `notification` (`id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, `type` varchar(255) NOT NULL, `data` text NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX `IDX_33f33cc8ef29d805a97ff4628b` (`type`), PRIMARY KEY (`id`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("CREATE TABLE `notification_recipient` (`notificationId` int(10) UNSIGNED NOT NULL, `userId` int NOT NULL, `readTime` datetime NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX `IDX_3b66c4f025880f69dcf9eb1c13` (`readTime`), INDEX `IDX_7cceafbd14efa80c21835deeb2` (`createTime`), PRIMARY KEY (`notificationId`, `userId`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `notification_recipient` ADD CONSTRAINT `FK_b4dfc095df59b1c99e7f2413f0f` FOREIGN KEY (`notificationId`) REFERENCES `notification`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION", undefined);
        await queryRunner.query("ALTER TABLE `notification_recipient` ADD CONSTRAINT `FK_75862303042acff969623e22d09` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `notification_recipient` DROP FOREIGN KEY `FK_75862303042acff969623e22d09`", undefined);
        await queryRunner.query("ALTER TABLE `notification_recipient` DROP FOREIGN KEY `FK_b4dfc095df59b1c99e7f2413f0f`", undefined);
        await queryRunner.query("DROP INDEX `IDX_7cceafbd14efa80c21835deeb2` ON `notification_recipient`", undefined);
        await queryRunner.query("DROP INDEX `IDX_3b66c4f025880f69dcf9eb1c13` ON `notification_recipient`", undefined);
        await queryRunner.query("DROP TABLE `notification_recipient`", undefined);
        await queryRunner.query("DROP INDEX `IDX_33f33cc8ef29d805a97ff4628b` ON `notification`", undefined);
        await queryRunner.query("DROP TABLE `notification`", undefined);
    }

}
