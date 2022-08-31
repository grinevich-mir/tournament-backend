import { Singleton } from '../../../core/ioc';
import { TournamentEntryEntity } from '../tournament-entry.entity';
import { TournamentEntry } from '../../tournament-entry';
import { TournamentEntryAllocationEntity } from '../tournament-entry-allocation.entity';
import { TournamentEntryAllocation } from '../../tournament-entry-allocation';
import { TournamentEntryPrizeEntity, TournamentEntryCashPrizeEntity, TournamentEntryUpgradePrizeEntity, TournamentEntryTangiblePrizeEntity } from '../tournament-entry-prize.entity';
import { PrizeType, Prize } from '../../../prize';

@Singleton
export class TournamentEntryEntityMapper {
    public fromEntity(source: TournamentEntryEntity): TournamentEntry {
        return {
            id: source.id,
            tournamentId: source.tournamentId,
            userId: source.userId,
            knockedOut: source.knockedOut,
            token: source.token,
            allocations: source.allocations ? source.allocations.map(a => this.allocationFromEntity(a)) : [],
            prizes: source.prizes ? source.prizes.map(p => this.prizeFromEntity(p)) : [],
            totalCost: source.totalCost,
            activatedTime: source.activatedTime,
            refundTime: source.refundTime,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public allocationFromEntity(source: TournamentEntryAllocationEntity): TournamentEntryAllocation {
        return {
            id: source.id,
            entryId: source.entryId,
            rounds: source.rounds,
            credit: source.credit,
            complete: source.complete,
            cost: source.cost,
            createTime: source.createTime,
            updateTime: source.updateTime
        };
    }

    public prizeFromEntity(source: TournamentEntryPrizeEntity): Prize {
        if (source instanceof TournamentEntryCashPrizeEntity)
            return {
                type: PrizeType.Cash,
                currencyCode: source.currencyCode,
                amount: source.amount
            };

        if (source instanceof TournamentEntryUpgradePrizeEntity)
            return {
                type: PrizeType.Upgrade,
                duration: source.duration,
                level: source.level
            };

        if (source instanceof TournamentEntryTangiblePrizeEntity)
            return {
                type: PrizeType.Tangible,
                name: source.name,
                shortName: source.shortName,
                imageUrl: source.imageUrl,
                cashAlternativeAmount: source.cashAlternativeAmount,
            };

        throw new Error(`Prize type ${source.type} not supported.`);
    }

    public prizeToEntity(entryId: number, source: Prize): TournamentEntryPrizeEntity {
        let entity: TournamentEntryCashPrizeEntity | TournamentEntryTangiblePrizeEntity | TournamentEntryUpgradePrizeEntity;

        switch (source.type) {
            case PrizeType.Cash:
                entity = new TournamentEntryCashPrizeEntity();
                entity.amount = source.amount;
                entity.currencyCode = source.currencyCode;
                break;

            case PrizeType.Upgrade:
                entity = new TournamentEntryUpgradePrizeEntity();
                entity.level = source.level;
                entity.duration = source.duration;
                break;

            case PrizeType.Tangible:
                entity = new TournamentEntryTangiblePrizeEntity();
                entity.name = source.name;
                entity.shortName = source.shortName;
                entity.imageUrl = source.imageUrl;
                entity.cashAlternativeAmount = source.cashAlternativeAmount;
                break;
        }

        if (!entity)
            throw new Error(`Prize type ${source.type} not supported.`);

        entity.entryId = entryId;
        entity.type = source.type;
        return entity;
    }

    public tournamentPrizeToEntity(entryId: number, source: Prize): TournamentEntryPrizeEntity {
        let entity: TournamentEntryCashPrizeEntity | TournamentEntryTangiblePrizeEntity | TournamentEntryUpgradePrizeEntity;

        switch (source.type) {
            case PrizeType.Cash:
                entity = new TournamentEntryCashPrizeEntity();
                entity.amount = source.amount;
                entity.currencyCode = source.currencyCode;
                break;

            case PrizeType.Upgrade:
                entity = new TournamentEntryUpgradePrizeEntity();
                entity.level = source.level;
                entity.duration = source.duration;
                break;

            case PrizeType.Tangible:
                entity = new TournamentEntryTangiblePrizeEntity();
                entity.name = source.name;
                entity.shortName = source.shortName;
                entity.imageUrl = source.imageUrl;
                entity.cashAlternativeAmount = source.cashAlternativeAmount;
                break;
        }

        if (!entity)
            throw new Error(`Prize type ${source.type} not supported.`);

        entity.entryId = entryId;
        entity.type = source.type;
        return entity;
    }
}
