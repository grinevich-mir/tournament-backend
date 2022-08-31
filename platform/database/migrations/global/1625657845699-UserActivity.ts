import { MigrationInterface, QueryRunner } from "typeorm";

export class UserActivity1625657845699 implements MigrationInterface {
    name = 'UserActivity1625657845699'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("CREATE INDEX `IDX_59c2a7a315b78467a11c386825` ON `payment` (`status`, `createTime`)");
        await queryRunner.query("CREATE INDEX `IDX_d132b1e377b541c8c085eb88f7` ON `order` (`status`, `createTime`)");
        await queryRunner.query("CREATE INDEX `IDX_f76c46808c30572074bf0bcbde` ON `tournament_entry_prize` (`createTime`)");
        await queryRunner.query("CREATE INDEX `IDX_ff55ef09a7fce18eedc8d2d74b` ON `tournament_entry` (`userId`)");
        await queryRunner.query("CREATE INDEX `IDX_08cdb38c058a9131b4157d9d03` ON `tournament_entry` (`createTime`)");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX `IDX_08cdb38c058a9131b4157d9d03` ON `tournament_entry`");
        await queryRunner.query("DROP INDEX `IDX_ff55ef09a7fce18eedc8d2d74b` ON `tournament_entry`");
        await queryRunner.query("DROP INDEX `IDX_f76c46808c30572074bf0bcbde` ON `tournament_entry_prize`");
        await queryRunner.query("DROP INDEX `IDX_d132b1e377b541c8c085eb88f7` ON `order`");
        await queryRunner.query("DROP INDEX `IDX_59c2a7a315b78467a11c386825` ON `payment`");
    }
}