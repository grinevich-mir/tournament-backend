import {MigrationInterface, QueryRunner} from "typeorm";

export class TournamentEntryCost1617111073015 implements MigrationInterface {
    name = 'TournamentEntryCost1617111073015'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE TABLE `tournament_template_entry_cost` (`id` int NOT NULL AUTO_INCREMENT, `amount` int NOT NULL, `templateId` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("CREATE TABLE `tournament_entry_cost` (`id` int NOT NULL AUTO_INCREMENT, `amount` int NOT NULL, `tournamentId` int NOT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB");
        await queryRunner.query("ALTER TABLE `tournament_entry` ADD `totalCost` int NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `tournament_entry_allocation` ADD `cost` int NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `tournament_template_entry_cost` ADD CONSTRAINT `FK_9cb5030a9920ea59f3f9293a90a` FOREIGN KEY (`templateId`) REFERENCES `tournament_template`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
        await queryRunner.query("ALTER TABLE `tournament_entry_cost` ADD CONSTRAINT `FK_5ef94bdf25c10519999327133a2` FOREIGN KEY (`tournamentId`) REFERENCES `tournament`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `tournament_entry_cost` DROP FOREIGN KEY `FK_5ef94bdf25c10519999327133a2`");
        await queryRunner.query("ALTER TABLE `tournament_template_entry_cost` DROP FOREIGN KEY `FK_9cb5030a9920ea59f3f9293a90a`");
        await queryRunner.query("ALTER TABLE `tournament_entry_allocation` DROP COLUMN `cost`");
        await queryRunner.query("ALTER TABLE `tournament_entry` DROP COLUMN `totalCost`");
        await queryRunner.query("DROP TABLE `tournament_entry_cost`");
        await queryRunner.query("DROP TABLE `tournament_template_entry_cost`");
    }

}
