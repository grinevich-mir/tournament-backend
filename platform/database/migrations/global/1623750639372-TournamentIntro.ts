import { MigrationInterface, QueryRunner } from "typeorm";

export class TournamentIntro1623750639372 implements MigrationInterface {
    name = 'TournamentIntro1623750639372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `tournament_intro` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `topContent` text NOT NULL, `bottomContent` text NOT NULL, `enabled` tinyint NOT NULL DEFAULT 1, `createTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `updateTime` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `tournament_template` ADD `introId` int NULL");
        await queryRunner.query("ALTER TABLE `tournament` ADD `introId` int NULL");
        await queryRunner.query("ALTER TABLE `tournament_template` ADD CONSTRAINT `FK_c234dac3e55d53419e132c55c15` FOREIGN KEY (`introId`) REFERENCES `tournament_intro`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `tournament` ADD CONSTRAINT `FK_f0f47d5eb2d40570e34a3b4db76` FOREIGN KEY (`introId`) REFERENCES `tournament_intro`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament` DROP FOREIGN KEY `FK_f0f47d5eb2d40570e34a3b4db76`");
        await queryRunner.query("ALTER TABLE `tournament_template` DROP FOREIGN KEY `FK_c234dac3e55d53419e132c55c15`");
        await queryRunner.query("ALTER TABLE `tournament` DROP COLUMN `introId`");
        await queryRunner.query("ALTER TABLE `tournament_template` DROP COLUMN `introId`");
        await queryRunner.query("DROP TABLE `tournament_intro`");
    }
}
