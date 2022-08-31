import { Singleton } from '../../../core/ioc';
import { PrizeType, RankedPrize } from '../../../prize';
import { LeaderboardScheduleEntity } from '../leaderboard-schedule.entity';
import { LeaderboardSchedule, NewLeaderboardSchedule, LeaderboardScheduleUpdate } from '../../leaderboard-schedule';
import { LeaderboardSchedulePrizeEntity, LeaderboardScheduleCashPrizeEntity, LeaderboardScheduleUpgradePrizeEntity, LeaderboardScheduleTangiblePrizeEntity } from '../leaderboard-schedule-prize.entity';

@Singleton
export class LeaderboardScheduleEntityMapper {
    public fromEntity(source: LeaderboardScheduleEntity): LeaderboardSchedule {
        return {
            name: source.name,
            frequency: source.frequency,
            offset: source.offset,
            prizes: source.prizes.map(p => this.prizeFromEntity(p)),
            pointConfig: source.pointConfig,
            minLevel: source.minLevel,
            autoPayout: source.autoPayout,
            enabled: source.enabled,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public toEntity(source: LeaderboardSchedule): LeaderboardScheduleEntity {
        const entity = new LeaderboardScheduleEntity();
        entity.name = source.name;
        entity.frequency = source.frequency;
        entity.offset = source.offset;
        entity.prizes = source.prizes.map(p => this.prizeToEntity(source.name, p));
        entity.pointConfig = source.pointConfig;
        entity.autoPayout = source.autoPayout;
        entity.enabled = source.enabled;
        entity.createTime = source.createTime;
        entity.updateTime = source.updateTime;
        return entity;
    }

    public newToEntity(source: NewLeaderboardSchedule): LeaderboardScheduleEntity {
        const entity = new LeaderboardScheduleEntity();
        entity.name = source.name;
        entity.frequency = source.frequency;
        entity.offset = source.offset;
        entity.prizes = source.prizes.map(p => this.prizeToEntity(source.name, p));
        entity.pointConfig = source.pointConfig;
        entity.autoPayout = source.autoPayout;
        entity.enabled = source.enabled;
        return entity;
    }

    public updateToEntity(source: LeaderboardScheduleUpdate): LeaderboardScheduleEntity {
        return this.newToEntity(source);
    }

    public prizeToEntity(scheduleName: string, source: RankedPrize): LeaderboardSchedulePrizeEntity {
        let entity: LeaderboardScheduleCashPrizeEntity | LeaderboardScheduleTangiblePrizeEntity | LeaderboardScheduleUpgradePrizeEntity;

        switch (source.type) {
            case PrizeType.Cash:
                entity = new LeaderboardScheduleCashPrizeEntity();
                entity.currencyCode = source.currencyCode;
                entity.amount = source.amount;
                break;

            case PrizeType.Upgrade:
                entity = new LeaderboardScheduleUpgradePrizeEntity();
                entity.level = source.level;
                entity.duration = source.duration;
                break;

            case PrizeType.Tangible:
                entity = new LeaderboardScheduleTangiblePrizeEntity();
                entity.name = source.name;
                entity.shortName = source.shortName;
                entity.imageUrl = source.imageUrl;
                entity.cashAlternativeAmount = source.cashAlternativeAmount;
                break;
        }

        if (!entity)
            throw new Error(`Prize type ${source.type} not supported.`);

        entity.type = source.type;
        entity.scheduleName = scheduleName;
        entity.startRank = source.startRank;
        entity.endRank = source.endRank;
        return entity;
    }

    public prizeFromEntity(source: LeaderboardSchedulePrizeEntity): RankedPrize {
        if (source instanceof LeaderboardScheduleCashPrizeEntity)
            return {
                type: PrizeType.Cash,
                startRank: source.startRank,
                endRank: source.endRank,
                currencyCode: source.currencyCode,
                amount: source.amount
            };

        if (source instanceof LeaderboardScheduleUpgradePrizeEntity)
            return {
                type: PrizeType.Upgrade,
                startRank: source.startRank,
                endRank: source.endRank,
                duration: source.duration,
                level: source.level
            };

        if (source instanceof LeaderboardScheduleTangiblePrizeEntity)
            return {
                type: PrizeType.Tangible,
                startRank: source.startRank,
                endRank: source.endRank,
                name: source.name,
                shortName: source.shortName,
                imageUrl: source.imageUrl,
                cashAlternativeAmount: source.cashAlternativeAmount,
            };

        throw new Error(`Prize type ${source.type} not supported.`);
    }
}