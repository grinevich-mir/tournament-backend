import {MigrationInterface, QueryRunner} from "typeorm";

export class JackpotResetPurpose1605019655245 implements MigrationInterface {
    name = 'JackpotResetPurpose1605019655245'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `jackpot_adjustment` CHANGE `purpose` `purpose` enum ('Seed', 'Payout', 'Contribution', 'Reset', 'Correction') NOT NULL", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `jackpot_adjustment` CHANGE `purpose` `purpose` enum ('Seed', 'Payout', 'Contribution') NOT NULL", undefined);
    }

}
