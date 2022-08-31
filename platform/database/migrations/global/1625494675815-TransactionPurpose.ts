import {MigrationInterface, QueryRunner} from "typeorm";

export class TransactionPurpose1625494675815 implements MigrationInterface {
    name = 'TransactionPurpose1625494675815'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `wallet_entry` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'JackpotPayout', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase', 'Consolidate', 'Confiscation', 'Compensation') NOT NULL");
        await queryRunner.query("ALTER TABLE `wallet_transaction` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'JackpotPayout', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase', 'Consolidate', 'Confiscation', 'Compensation') NOT NULL");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `wallet_transaction` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'JackpotPayout', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase') NOT NULL");
        await queryRunner.query("ALTER TABLE `wallet_entry` CHANGE `purpose` `purpose` enum ('Deposit', 'Withdrawal', 'BuyIn', 'PayOut', 'JackpotPayout', 'Adjustment', 'Promotion', 'Subscription', 'Refund', 'Purchase') NOT NULL");
    }

}
