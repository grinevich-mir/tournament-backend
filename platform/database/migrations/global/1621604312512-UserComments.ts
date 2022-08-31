import {MigrationInterface, QueryRunner} from "typeorm";

export class UserComments1621604312512 implements MigrationInterface {
    name = 'UserComments1621604312512'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `user_comment` (`id` int NOT NULL AUTO_INCREMENT, `comment` text NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `userId` int NOT NULL, `author` varchar(255) NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `user_comment` ADD CONSTRAINT `FK_ebd475b57b16b0039934dc31a14` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user_comment` DROP FOREIGN KEY `FK_ebd475b57b16b0039934dc31a14`");
        await queryRunner.query("DROP TABLE `user_comment`");
    }

}
