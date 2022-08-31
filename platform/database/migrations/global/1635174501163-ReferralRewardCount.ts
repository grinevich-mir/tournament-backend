import {MigrationInterface, QueryRunner} from "typeorm";

export class ReferralRewardCount1635174501163 implements MigrationInterface {
    name = 'ReferralRewardCount1635174501163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `referral_user` ADD `rewardCount` int NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `referral` ADD `rewardCount` int NOT NULL DEFAULT 0");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `referral` DROP COLUMN `rewardCount`");
        await queryRunner.query("ALTER TABLE `referral_user` DROP COLUMN `rewardCount`");
    }

}
