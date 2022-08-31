import {MigrationInterface, QueryRunner} from "typeorm";

export class UserProfileEmailIndex1600425154550 implements MigrationInterface {
    name = 'UserProfileEmailIndex1600425154550'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `IDX_e336cc51b61c40b1b1731308aa` ON `user_profile` (`email`)", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_e336cc51b61c40b1b1731308aa` ON `user_profile`", undefined);
    }

}
