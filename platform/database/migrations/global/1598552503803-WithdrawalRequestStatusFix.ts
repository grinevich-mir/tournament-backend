import {MigrationInterface, QueryRunner} from "typeorm";

export class WithdrawalRequestStatusFix1598552503803 implements MigrationInterface {
    name = 'WithdrawalRequestStatusFix1598552503803'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_3e0774573151b835b0d54a1d7d` ON `withdrawal_request`", undefined);
        await queryRunner.query("ALTER TABLE `withdrawal_request` MODIFY COLUMN `status` enum ('Pending', 'Processing', 'Complete', 'Cancelled') NOT NULL DEFAULT 'Pending'", undefined);
        await queryRunner.query("CREATE INDEX `IDX_3e0774573151b835b0d54a1d7d` ON `withdrawal_request` (`status`)", undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_3e0774573151b835b0d54a1d7d` ON `withdrawal_request`", undefined);
        await queryRunner.query("ALTER TABLE `withdrawal_request` MODIFY COLUMN `status` varchar(255) NOT NULL DEFAULT 'Pending'", undefined);
        await queryRunner.query("CREATE INDEX `IDX_3e0774573151b835b0d54a1d7d` ON `withdrawal_request` (`status`)", undefined);
    }

}
