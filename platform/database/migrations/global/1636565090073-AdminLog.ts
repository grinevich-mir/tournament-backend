import {MigrationInterface, QueryRunner} from "typeorm";

export class AdminLog1636565090073 implements MigrationInterface {
    name = 'AdminLog1636565090073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `admin_log` (`id` int NOT NULL AUTO_INCREMENT, `userId` varchar(255) NOT NULL, `resource` varchar(255) NOT NULL, `action` varchar(255) NOT NULL, `data` text NOT NULL, `additionalData` text NULL, `timestamp` datetime NOT NULL, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX `IDX_3bb7f40b8cb95415343a431d58` (`userId`), PRIMARY KEY (`id`, `timestamp`)) ENGINE=InnoDB");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_3bb7f40b8cb95415343a431d58` ON `admin_log`");
        await queryRunner.query("DROP TABLE `admin_log`");
    }

}
