import {MigrationInterface, QueryRunner, In} from "typeorm";
import { tiers } from './0000000000007-Subscriptions';
import { UpgradeConfigEntity, UpgradeLevelConfigEntity } from '../../../../src/upgrade/entities';
import _ from 'lodash';

const tiersBySkin = _.groupBy(tiers, t => t.skinId);

const configs: UpgradeConfigEntity[] = Object.keys(tiersBySkin).map(skin => {
    const maxLevelUpgrade = _.maxBy(tiersBySkin[skin], u => u.level);

    if (!maxLevelUpgrade)
        throw new Error('No maximum upgrade level found.');

    const config = new UpgradeConfigEntity();
    config.skinId = skin;
    config.codeExpiry = 24;
    config.codeProcessExpiry = 14;
    config.codeUpgradeDuration = 1;
    config.codeUpgradeLevel = maxLevelUpgrade.level;
    return config;
});

const levelConfigs: UpgradeLevelConfigEntity[] = _.flatMap(Object.keys(tiersBySkin), (skin => {
    const zeroConfig = new UpgradeLevelConfigEntity();
    zeroConfig.skinId = skin;
    zeroConfig.level = 0;
    zeroConfig.tournamentMaxActiveEntries = 1;
    zeroConfig.withdrawalMinAmounts = {
        USD: 50
    };
    zeroConfig.withdrawalTargetDays = 7;
    zeroConfig.enabled = false; // TEMPORARY

    const configs = tiersBySkin[skin].map(tier => {
        const config = new UpgradeLevelConfigEntity();
        config.skinId = skin;
        config.level = tier.level;
        config.tournamentMaxActiveEntries = tier.level * 2;
        config.withdrawalMinAmounts = {
            USD: 20
        };
        config.withdrawalTargetDays = 3;
        config.enabled = false;  // TEMPORARY
        return config;
    });

    return [zeroConfig, ...configs];
}));

export class UserUpgrades0000000000009 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.manager.insert(UpgradeConfigEntity, configs);
        await queryRunner.manager.insert(UpgradeLevelConfigEntity, levelConfigs);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(UpgradeConfigEntity)
            .where({ skinId: In(configs.map(c => c.skinId)) })
            .execute();

        await queryRunner.connection.createQueryBuilder(queryRunner)
            .delete()
            .from(UpgradeLevelConfigEntity)
            .where({ skinId: In(levelConfigs.map(c => c.skinId)), level: In(levelConfigs.map(c => c.level)) })
            .execute();
    }

}
