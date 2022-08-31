import { Singleton } from '../../../core/ioc';
import { LeaderboardEntity } from '../leaderboard.entity';
import { LeaderboardEntryEntity } from '../leaderboard-entry.entity';
import { LeaderboardEntry } from '../../leaderboard-entry';
import { LeaderboardInfo } from '../../leaderboard-info';
import { LeaderboardPrizeEntity, LeaderboardCashPrizeEntity, LeaderboardUpgradePrizeEntity, LeaderboardTangiblePrizeEntity } from '../leaderboard-prize.entity';
import { PrizeType, RankedPrize } from '../../../prize';
import { Leaderboard } from '../../leaderboard';
import { NewLeaderboard } from '../../new-leaderboard';

@Singleton
export class LeaderboardEntityMapper {
    public newToEntity(source: NewLeaderboard): LeaderboardEntity {
        const entity = new LeaderboardEntity();
        entity.type = source.type;

        if (source.prizes)
            entity.prizes = source.prizes.map(p => this.prizeToEntity(0, p));

        if (source.pointConfig)
            entity.pointConfig = source.pointConfig;

        return entity;
    }

    public fromEntity(source: LeaderboardEntity): Leaderboard {
        return {
            id: source.id,
            type: source.type,
            entryCount: source.entryCount,
            prizes: source.prizes.map(p => this.prizeFromEntity(p)),
            entries: source.entries.map(e => this.entryFromEntity(e)),
            pointConfig: source.pointConfig,
            finalised: source.finalised,
            payoutTime: source.payoutTime,
            createTime: source.createTime
        };
    }

    public infoFromEntity(source: LeaderboardEntity): LeaderboardInfo {
        return {
            id: source.id,
            type: source.type,
            entryCount: source.entryCount,
            prizes: source.prizes ? source.prizes.map(p => this.prizeFromEntity(p)) : [],
            pointConfig: source.pointConfig,
            finalised: source.finalised,
            payoutTime: source.payoutTime,
            createTime: source.createTime
        };
    }

    public entryFromEntity(source: LeaderboardEntryEntity): LeaderboardEntry {
        return {
            userId: source.userId,
            displayName: source.user?.displayName || 'Anonymous',
            country: source.user?.country || 'US',
            rank: source.rank || 0,
            points: source.points,
            tieBreaker: source.tieBreaker,
            runningPoints: source.runningPoints,
            runningTieBreaker: source.runningTieBreaker,
        };
    }

    public prizeToEntity(leaderboardId: number, source: RankedPrize): LeaderboardPrizeEntity {
        let entity: LeaderboardCashPrizeEntity | LeaderboardTangiblePrizeEntity | LeaderboardUpgradePrizeEntity;

        switch (source.type) {
            case PrizeType.Cash:
                entity = new LeaderboardCashPrizeEntity();
                entity.currencyCode = source.currencyCode;
                entity.amount = source.amount;
                break;

            case PrizeType.Upgrade:
                entity = new LeaderboardUpgradePrizeEntity();
                entity.level = source.level;
                entity.duration = source.duration;
                break;

            case PrizeType.Tangible:
                entity = new LeaderboardTangiblePrizeEntity();
                entity.name = source.name;
                entity.shortName = source.shortName;
                entity.imageUrl = source.imageUrl;
                entity.cashAlternativeAmount = source.cashAlternativeAmount;
                break;
        }

        if (!entity)
            throw new Error(`Prize type ${source.type} not supported.`);

        entity.type = source.type;

        if (leaderboardId > 0)
            entity.leaderboardId = leaderboardId;
        entity.startRank = source.startRank;
        entity.endRank = source.endRank;
        return entity;
    }

    public prizeFromEntity(source: LeaderboardPrizeEntity): RankedPrize {
        if (source instanceof LeaderboardCashPrizeEntity)
            return {
                type: PrizeType.Cash,
                startRank: source.startRank,
                endRank: source.endRank,
                currencyCode: source.currencyCode,
                amount: source.amount
            };

        if (source instanceof LeaderboardUpgradePrizeEntity)
            return {
                type: PrizeType.Upgrade,
                startRank: source.startRank,
                endRank: source.endRank,
                duration: source.duration,
                level: source.level
            };

        if (source instanceof LeaderboardTangiblePrizeEntity)
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