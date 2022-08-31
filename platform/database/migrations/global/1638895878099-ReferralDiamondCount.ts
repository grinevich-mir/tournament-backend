import {MigrationInterface, QueryRunner} from "typeorm";

export class ReferralDiamondCount1638895878099 implements MigrationInterface {
    name = 'ReferralDiamondCount1638895878099'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `referral_user` ADD `diamondCount` int NOT NULL DEFAULT 0");
        await queryRunner.query("ALTER TABLE `referral` ADD `diamondCount` int NOT NULL DEFAULT 0");
        await queryRunner.query("UPDATE `referral_user` r INNER JOIN (SELECT userId, SUM(amount) as total FROM `referral_reward` WHERE `type` = 'Diamonds' GROUP BY userId) x ON r.userId = x.userId SET r.diamondCount = x.total");
        await queryRunner.query("UPDATE `referral` r INNER JOIN (SELECT referralId, SUM(amount) as total FROM `referral_reward` WHERE `type` = 'Diamonds' GROUP BY referralId) x ON r.id = x.referralId SET r.diamondCount = x.total");
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `referral` DROP COLUMN `diamondCount`");
        await queryRunner.query("ALTER TABLE `referral_user` DROP COLUMN `diamondCount`");
    }

}
