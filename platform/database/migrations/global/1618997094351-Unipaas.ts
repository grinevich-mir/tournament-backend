import {MigrationInterface, QueryRunner} from "typeorm";

export class Unipaas1618997094351 implements MigrationInterface {
    name = 'Unipaas1618997094351'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `payment` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas') NOT NULL");
        await queryRunner.query("DROP INDEX `IDX_e142925d97ee578d9f4966827b` ON `subscription`");
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `provider` `provider` enum ('Chargify', 'Unipaas') NOT NULL");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_e142925d97ee578d9f4966827b` ON `subscription` (`provider`, `providerRef`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_e142925d97ee578d9f4966827b` ON `subscription`");
        await queryRunner.query("ALTER TABLE `subscription` CHANGE `provider` `provider` enum ('Chargify') NOT NULL");
        await queryRunner.query("CREATE UNIQUE INDEX `IDX_e142925d97ee578d9f4966827b` ON `subscription` (`provider`, `providerRef`)");
        await queryRunner.query("ALTER TABLE `payment_method` CHANGE `provider` `provider` enum ('Chargify') NOT NULL");
        await queryRunner.query("ALTER TABLE `payment` CHANGE `provider` `provider` enum ('Chargify') NOT NULL");
    }

}
