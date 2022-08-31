import { TournamentTemplateEntity } from '../tournament-template.entity';
import { TournamentTemplate } from '../../tournament-template';
import { Singleton } from '../../../core/ioc';
import { TournamentTemplateGameAssignmentEntity } from '../tournament-template-game-assignment.entity';
import { TournamentTemplateGameAssignment } from '../../tournament-template-game-assignment';
import { TournamentTemplatePrizeEntity, TournamentTemplateCashPrizeEntity, TournamentTemplateUpgradePrizeEntity, TournamentTemplateTangiblePrizeEntity } from '../tournament-template-prize.entity';
import { PrizeType, RankedPrize } from '../../../prize';
import { NewTournamentTemplate } from '../../new-tournament-template';
import { SkinEntity } from '../../../skin/entities';
import { TournamentTemplateUpdate } from '../../tournament-template-update';
import { TournamentTemplateJackpotTriggerEntity } from '../tournament-template-jackpot-trigger.entity';
import { JackpotTrigger } from '../../../jackpot';
import _ from 'lodash';
import { TournamentTemplateEntryCostEntity } from '../tournament-template-entry-cost.entity';

@Singleton
export class TournamentTemplateEntityMapper {
    public fromEntity(source: TournamentTemplateEntity): TournamentTemplate {
        return {
            id: source.id,
            name: source.name,
            group: source.group,
            tags: source.tags,
            allowJoinAfterStart: source.allowJoinAfterStart,
            allowedPowerups: source.allowedPowerups,
            autoPayout: source.autoPayout,
            bannerImgUrl: source.bannerImgUrl,
            chatEnabled: source.chatEnabled,
            chatChannel: source.chatChannel,
            createTime: source.createTime,
            currencyCode: source.currencyCode,
            description: source.description,
            rules: source.rules,
            enabled: source.enabled,
            gameAssignments: _.orderBy(source.gameAssignments, t => t.position, 'asc').map(g => this.gameAssignmentFromEntity(g)),
            gameSelectionType: source.gameSelectionType,
            leaderboardMode: source.leaderboardMode,
            leaderboardPointMode: source.leaderboardPointMode,
            maxPlayers: source.maxPlayers,
            minLevel: source.minLevel,
            maxLevel: source.maxLevel,
            minPlayers: source.minPlayers,
            prizes: _.orderBy(source.prizes, p => p.startRank, 'asc').map(p => this.prizeFromEntity(p)),
            public: source.public,
            region: source.region,
            skins: source.skins.map(s => s.id),
            type: source.typeId,
            runtime: source.runtime,
            displayPriority: source.displayPriority,
            updateTime: source.updateTime,
            durationMins: source.durationMins,
            entryCosts: source.entryCosts ? source.entryCosts.map(c => c.amount) : [],
            entryAllocationCredit: source.entryAllocationCredit,
            entryAllocationRounds: source.entryAllocationRounds,
            maxEntryAllocations: source.maxEntryAllocations,
            entryCutOff: source.entryCutOff,
            gameColour: source.gameColour,
            nameColour: source.nameColour,
            leaderboardPointConfig: source.leaderboardPointConfig,
            metadata: source.metadata,
            prizeTotal: source.prizeTotal,
            cronPattern: source.cronPattern,
            jackpotTriggers: _.orderBy(source.jackpotTriggers, t => t.threshold, 'desc').map(t => this.jackpotTriggerFromEntity(t)),
            contributionGroups: source.contributionGroups || [],
            introId: source.introId
        };
    }

    public newTemplateToEntity(source: NewTournamentTemplate): TournamentTemplateEntity {
        const entity = new TournamentTemplateEntity();
        entity.typeId = source.type;
        entity.runtime = source.runtime;
        entity.skins = source.skins.map(s => {
            const skinEntity = new SkinEntity();
            skinEntity.id = s;
            return skinEntity;
        });
        entity.leaderboardMode = source.leaderboardMode;
        entity.leaderboardPointConfig = source.leaderboardPointConfig;
        entity.leaderboardPointMode = source.leaderboardPointMode;
        entity.allowJoinAfterStart = source.allowJoinAfterStart;
        entity.allowedPowerups = source.allowedPowerups;
        entity.autoPayout = source.autoPayout;
        entity.bannerImgUrl = source.bannerImgUrl;
        entity.chatEnabled = source.chatEnabled;
        entity.chatChannel = source.chatChannel;
        entity.cronPattern = source.cronPattern;
        entity.currencyCode = source.currencyCode;
        entity.description = source.description;
        entity.displayPriority = source.displayPriority;
        entity.rules = source.rules;
        entity.durationMins = source.durationMins;
        entity.enabled = source.enabled;
        entity.public = source.public;
        entity.entryAllocationCredit = source.entryAllocationCredit;
        entity.entryAllocationRounds = source.entryAllocationRounds;
        entity.entryCutOff = source.entryCutOff;
        entity.gameAssignments = source.gameAssignments.map(g => this.gameAssignmentToEntity(g));
        entity.gameColour = source.gameColour;
        entity.gameSelectionType = source.gameSelectionType;
        entity.minPlayers = source.minPlayers;
        entity.maxPlayers = source.maxPlayers;
        entity.minLevel = source.minLevel;
        entity.maxLevel = source.maxLevel;
        entity.region = source.region;
        entity.name = source.name;
        entity.group = source.group;
        entity.tags = source.tags;
        entity.nameColour = source.nameColour;
        entity.prizeTotal = source.prizeTotal;
        entity.prizes = source.prizes.map(p => this.prizeToEntity(p));
        entity.entryCosts = source.entryCosts.map(c => this.entryCostToEntity(c));
        entity.jackpotTriggers = source.jackpotTriggers ? source.jackpotTriggers.map(t => this.jackpotTriggerToEntity(t)) : [];
        entity.contributionGroups = source.contributionGroups;
        entity.introId = source.introId;
        return entity;
    }

    public entityToNewTemplate(source: TournamentTemplateEntity): NewTournamentTemplate {
        return {
            name: source.name,
            group: source.group,
            tags: source.tags,
            allowJoinAfterStart: source.allowJoinAfterStart,
            allowedPowerups: source.allowedPowerups,
            autoPayout: source.autoPayout,
            bannerImgUrl: source.bannerImgUrl,
            chatEnabled: source.chatEnabled,
            currencyCode: source.currencyCode,
            description: source.description,
            rules: source.rules,
            enabled: source.enabled,
            gameAssignments: source.gameAssignments.map(g => this.gameAssignmentFromEntity(g)),
            gameSelectionType: source.gameSelectionType,
            leaderboardMode: source.leaderboardMode,
            leaderboardPointMode: source.leaderboardPointMode,
            maxPlayers: source.maxPlayers,
            minLevel: source.minLevel,
            maxLevel: source.maxLevel,
            minPlayers: source.minPlayers,
            prizes: source.prizes.map(p => this.prizeFromEntity(p)),
            public: source.public,
            region: source.region,
            skins: source.skins.map(s => s.id),
            type: source.typeId,
            runtime: source.runtime,
            displayPriority: source.displayPriority,
            durationMins: source.durationMins,
            entryCosts: source.entryCosts.map(m => m.amount),
            entryAllocationCredit: source.entryAllocationCredit,
            entryAllocationRounds: source.entryAllocationRounds,
            maxEntryAllocations: source.maxEntryAllocations,
            entryCutOff: source.entryCutOff,
            gameColour: source.gameColour,
            nameColour: source.nameColour,
            leaderboardPointConfig: source.leaderboardPointConfig,
            metadata: source.metadata,
            prizeTotal: source.prizeTotal,
            cronPattern: source.cronPattern,
            jackpotTriggers: source.jackpotTriggers.map(t => this.jackpotTriggerFromEntity(t)),
            contributionGroups: source.contributionGroups,
            introId: source.introId
        };
    }

    public updateToEntity(id: number, update: TournamentTemplateUpdate): TournamentTemplateEntity {
        const entity = new TournamentTemplateEntity();
        entity.id = id;
        if (update.name)
            entity.name = update.name;
        if (update.description)
            entity.description = update.description;
        if (update.bannerImgUrl)
            entity.bannerImgUrl = update.bannerImgUrl;
        if (update.minLevel !== undefined)
            entity.minLevel = update.minLevel;
        if (update.maxLevel !== undefined)
            entity.maxLevel = update.maxLevel >= 0 ? update.maxLevel : null as unknown as number;
        if (update.metadata)
            entity.metadata = update.metadata;
        if (update.cronPattern)
            entity.cronPattern = update.cronPattern;
        if (update.autoPayout !== undefined)
            entity.autoPayout = update.autoPayout;
        if (update.allowJoinAfterStart !== undefined)
            entity.allowJoinAfterStart = update.allowJoinAfterStart;
        if (update.chatEnabled !== undefined)
            entity.chatEnabled = update.chatEnabled;
        if (update.chatChannel !== undefined)
            entity.chatChannel = update.chatChannel;
        if (update.entryAllocationCredit !== undefined)
            entity.entryAllocationCredit = update.entryAllocationCredit > 0 ? update.entryAllocationCredit : null as unknown as number;
        if (update.entryAllocationRounds !== undefined)
            entity.entryAllocationRounds = update.entryAllocationRounds > 0 ? update.entryAllocationRounds : null as unknown as number;
        if (update.maxEntryAllocations !== undefined)
            entity.maxEntryAllocations = update.maxEntryAllocations > 0 ? update.maxEntryAllocations : null as unknown as number;
        if (update.group)
            entity.group = update.group;
        if (update.gameSelectionType)
            entity.gameSelectionType = update.gameSelectionType;
        if (update.displayPriority !== undefined)
            entity.displayPriority = update.displayPriority;
        if (update.public !== undefined)
            entity.public = update.public;
        if (update.enabled !== undefined)
            entity.enabled = update.enabled;
        if (update.prizeTotal !== undefined)
            entity.prizeTotal = update.prizeTotal;
        if (update.minPlayers !== undefined)
            entity.minPlayers = update.minPlayers;
        if (update.maxPlayers)
            entity.maxPlayers = update.maxPlayers;
        if (update.durationMins !== undefined)
            entity.durationMins = update.durationMins > 0 ? update.durationMins : null as unknown as number;
        if (update.contributionGroups !== undefined)
            entity.contributionGroups = update.contributionGroups;
        if (update.entryCutOff !== undefined)
            entity.entryCutOff = update.entryCutOff > 0 ? update.entryCutOff : null as unknown as number;
        if (update.tags)
            entity.tags = update.tags;
        if (update.runtime)
            entity.runtime = update.runtime;
        if (update.introId !== undefined)
            entity.introId = update.introId === 0 ? null as unknown as undefined : update.introId;

        return entity;
    }

    public gameAssignmentFromEntity(source: TournamentTemplateGameAssignmentEntity): TournamentTemplateGameAssignment {
        return {
            gameId: source.gameId,
            position: source.position,
            metadataOverride: source.metadataOverride
        };
    }

    public gameAssignmentToEntity(source: TournamentTemplateGameAssignment): TournamentTemplateGameAssignmentEntity {
        const entity = new TournamentTemplateGameAssignmentEntity();
        entity.gameId = source.gameId;
        entity.position = source.position;
        entity.metadataOverride = source.metadataOverride;
        return entity;
    }

    public prizeFromEntity(source: TournamentTemplatePrizeEntity): RankedPrize {
        if (source instanceof TournamentTemplateCashPrizeEntity)
            return {
                type: PrizeType.Cash,
                startRank: source.startRank,
                endRank: source.endRank,
                amount: source.amount,
                currencyCode: source.currencyCode
            };

        if (source instanceof TournamentTemplateUpgradePrizeEntity)
            return {
                type: PrizeType.Upgrade,
                startRank: source.startRank,
                endRank: source.endRank,
                level: source.level,
                duration: source.duration
            };

        if (source instanceof TournamentTemplateTangiblePrizeEntity)
            return {
                type: PrizeType.Tangible,
                startRank: source.startRank,
                endRank: source.endRank,
                name: source.name,
                shortName: source.shortName,
                imageUrl: source.imageUrl,
                cashAlternativeAmount: source.cashAlternativeAmount,
            };

        throw new Error(`Unsupported prize type '${source.type}'.`);
    }

    public prizeToEntity(source: RankedPrize): TournamentTemplatePrizeEntity {
        let prize: TournamentTemplateCashPrizeEntity | TournamentTemplateTangiblePrizeEntity | TournamentTemplateUpgradePrizeEntity | undefined;

        switch (source.type) {
            case PrizeType.Cash:
                prize = new TournamentTemplateCashPrizeEntity();
                prize.type = PrizeType.Cash;
                prize.currencyCode = source.currencyCode;
                prize.amount = source.amount;
                break;

            case PrizeType.Upgrade:
                prize = new TournamentTemplateUpgradePrizeEntity();
                prize.type = PrizeType.Upgrade;
                prize.duration = source.duration;
                prize.level = source.level;
                break;

            case PrizeType.Tangible:
                prize = new TournamentTemplateTangiblePrizeEntity();
                prize.type = PrizeType.Tangible;
                prize.name = source.name;
                prize.shortName = source.shortName;
                prize.imageUrl = source.imageUrl;
                prize.cashAlternativeAmount = source.cashAlternativeAmount;
                break;
        }

        if (!prize)
            throw new Error(`Unsupported prize type '${source.type}'.`);

        prize.startRank = source.startRank;
        prize.endRank = source.endRank;
        return prize;
    }

    public entryCostToEntity(amount: number): TournamentTemplateEntryCostEntity {
        const entity = new TournamentTemplateEntryCostEntity();
        entity.amount = amount;
        return entity;
    }

    public jackpotTriggerFromEntity(source: TournamentTemplateJackpotTriggerEntity): JackpotTrigger {
        return {
            jackpotId: source.jackpotId,
            threshold: source.threshold,
            minLevel: source.minLevel,
            final: source.final,
            enabled: source.enabled
        };
    }

    public jackpotTriggerToEntity(source: JackpotTrigger): TournamentTemplateJackpotTriggerEntity {
        const entity = new TournamentTemplateJackpotTriggerEntity();
        entity.jackpotId = source.jackpotId;
        entity.threshold = source.threshold;
        entity.minLevel = source.minLevel;
        entity.final = source.final;
        entity.enabled = source.enabled;
        return entity;
    }
}
