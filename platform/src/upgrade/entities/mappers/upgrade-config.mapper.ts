import { Singleton } from '../../../core/ioc';
import { UpgradeConfigEntity } from '../upgrade-config.entity';
import { UpgradeConfig } from '../../upgrade-config';
import { UpgradeLevelConfigEntity } from '../upgrade-level-config.entity';
import { UpgradeLevelConfig } from '../../upgrade-level-config';

@Singleton
export class UpgradeConfigEntityMapper {
    public fromEntity(source: UpgradeConfigEntity): UpgradeConfig {
        return {
            skinId: source.skinId,
            codeExpiry: source.codeExpiry,
            codeProcessExpiry: source.codeProcessExpiry,
            codeUpgradeDuration: source.codeUpgradeDuration,
            codeUpgradeLevel: source.codeUpgradeLevel,
            codeDiamonds: source.codeDiamonds,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public levelFromEntity(source: UpgradeLevelConfigEntity): UpgradeLevelConfig {
        return {
            skinId: source.skinId,
            enabled: source.enabled,
            level: source.level,
            tournamentMaxActiveEntries: source.tournamentMaxActiveEntries,
            withdrawalMinAmounts: source.withdrawalMinAmounts,
            withdrawalTargetDays: source.withdrawalTargetDays,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }
}