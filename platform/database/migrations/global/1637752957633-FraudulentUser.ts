import {MigrationInterface, QueryRunner} from "typeorm";

export class FraudulentUser1637752957633 implements MigrationInterface {
    name = 'FraudulentUser1637752957633'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` ADD `fraudulent` tinyint NOT NULL DEFAULT 0");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `user` DROP COLUMN `fraudulent`");
    }

}
