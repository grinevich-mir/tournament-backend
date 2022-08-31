import { Singleton } from '../../../core/ioc';
import { LogClass } from '../../../core/logging';
import { Jackpot } from '../../jackpot';
import { JackpotPayout } from '../../jackpot-payout';
import { JackpotType } from '../../jackpot-type';
import { NewJackpot } from '../../new-jackpot';
import { JackpotPayoutEntity } from '../jackpot-payout.entity';
import { FixedJackpotEntity, JackpotEntity, ProgressiveJackpotEntity } from '../jackpot.entity';

@Singleton
@LogClass()
export class JackpotEntityMapper {
    public fromEntity(source: JackpotEntity): Jackpot {
        if (source instanceof ProgressiveJackpotEntity)
            return {
                id: source.id,
                type: JackpotType.Progressive,
                name: source.name,
                label: source.label,
                seed: source.seed,
                splitPayout: source.splitPayout,
                balance: source.balance,
                balanceUpdateTime: source.balanceUpdateTime,
                contributionGroup: source.contributionGroup,
                contributionMultiplier: source.contributionMultiplier,
                maxContribution: source.maxContribution,
                maxBalance: source.maxBalance,
                enabled: source.enabled,
                lastPayoutTime: source.lastPayoutTime,
                lastPayoutAmount: source.lastPayoutAmount,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        if (source instanceof FixedJackpotEntity)
            return {
                id: source.id,
                type: JackpotType.Fixed,
                name: source.name,
                label: source.label,
                seed: source.seed,
                splitPayout: source.splitPayout,
                balance: source.balance,
                balanceUpdateTime: source.balanceUpdateTime,
                enabled: source.enabled,
                lastPayoutTime: source.lastPayoutTime,
                lastPayoutAmount: source.lastPayoutAmount,
                createTime: source.createTime,
                updateTime: source.updateTime
            };

        throw new Error(`Jackpot type ${source.type} not supported.`);
    }

    public newToEntity(source: NewJackpot): JackpotEntity {
        let entity: FixedJackpotEntity | ProgressiveJackpotEntity | undefined;

        switch (source.type) {
            case JackpotType.Fixed:
                const fixedEntity = new FixedJackpotEntity();
                if (source.seed)
                    fixedEntity.seed = source.seed;
                if (source.splitPayout !== undefined)
                    fixedEntity.splitPayout = source.splitPayout;
                entity = fixedEntity;
                break;

            case JackpotType.Progressive:
                const progressiveEntity = new ProgressiveJackpotEntity();
                if (source.seed)
                    progressiveEntity.seed = source.seed;
                if (source.splitPayout !== undefined)
                    progressiveEntity.splitPayout = source.splitPayout;
                if (source.contributionGroup)
                    progressiveEntity.contributionGroup = source.contributionGroup;
                if (source.contributionMultiplier)
                    progressiveEntity.contributionMultiplier = source.contributionMultiplier;
                if (source.contributionMultiplier)
                    progressiveEntity.maxContribution = source.maxContribution;
                if (source.maxBalance)
                    progressiveEntity.maxBalance = source.maxBalance;
                entity = progressiveEntity;
                break;
        }

        if (!entity)
            throw new Error(`Jackpot type ${source.type} not supported.`);

        entity.name = source.name;
        entity.label = source.label;
        entity.type = source.type;
        entity.enabled = false;

        return entity;
    }

    public mapPayout(source: JackpotPayoutEntity): JackpotPayout {
        return {
            id: source.id,
            jackpotId: source.jackpotId,
            userId: source.userId,
            amount: source.amount,
            walletEntryId: source.walletEntryId,
            createTime: source.createTime
        };
    }
}