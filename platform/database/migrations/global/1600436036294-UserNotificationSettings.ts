import {MigrationInterface, QueryRunner} from "typeorm";

export class UserNotificationSettings1600436036294 implements MigrationInterface {
    name = 'UserNotificationSettings1600436036294'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `user_notification_setting` (`userId` int NOT NULL, `channel` enum ('Email') NOT NULL, `enabled` tinyint NOT NULL DEFAULT 1, `account` tinyint NOT NULL DEFAULT 1, `prize` tinyint NOT NULL DEFAULT 1, `marketing` tinyint NOT NULL DEFAULT 1, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`userId`, `channel`)) ENGINE=InnoDB", undefined);
        await queryRunner.query("ALTER TABLE `user_notification_setting` ADD CONSTRAINT `FK_e7ee7354867fcc26a11c5835078` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user_notification_setting` DROP FOREIGN KEY `FK_e7ee7354867fcc26a11c5835078`", undefined);
        await queryRunner.query("DROP TABLE `user_notification_setting`", undefined);
    }

}
