import { Singleton, Inject } from '../../../core/ioc';
import { TournamentEntity } from '../tournament.entity';
import { Tournament } from '../../tournament';
import { TournamentPrizeEntity, TournamentCashPrizeEntity, TournamentUpgradePrizeEntity, TournamentTangiblePrizeEntity } from '../tournament-prize.entity';
import { PrizeType, RankedPrize } from '../../../prize';
import { TournamentTemplateGameSelector } from '../../utilities';
import moment from 'moment';
import { TournamentTemplate } from '../../tournament-template';
import { SkinEntity } from '../../../skin/entities';
import { TournamentState } from '../../tournament-state';
import { LeaderboardPointConfig } from '../../../leaderboard';
import { LogMethod } from '../../../core/logging';
import { TournamentUpdate } from '../../tournament-update';
import { TournamentJackpotTriggerEntity } from '../tournament-jackpot-trigger.entity';
import { JackpotTrigger } from '../../../jackpot';
import _ from 'lodash';
import { TournamentEntryCostEntity } from '../tournament-entry-cost.entity';

@Singleton
export class TournamentEntityMapper {
    constructor(
        @Inject private readonly gameSelector: TournamentTemplateGameSelector) {
    }

    public fromEntity(source: TournamentEntity): Tournament {
        return {
            id: source.id,
            templateId: source.templateId,
            name: source.name,
            description: source.description,
            group: source.group,
            allowJoinAfterStart: source.allowJoinAfterStart,
            allowedPowerups: source.allowedPowerups,
            autoPayout: source.autoPayout,
            bannerImgUrl: source.bannerImgUrl,
            chatEnabled: source.chatEnabled,
            chatChannel: source.chatChannel,
            createTime: source.createTime,
            currencyCode: source.currencyCode,
            rules: source.rules,
            enabled: source.enabled,
            gameId: source.gameId,
            gameMetadataOverride: source.gameMetadataOverride,
            gamePosition: source.gamePosition,
            launchTime: source.launchTime,
            leaderboardMode: source.leaderboardMode,
            leaderboardId: source.leaderboardId,
            leaderboardPointConfig: source.leaderboardPointConfig,
            leaderboardPointMode: source.leaderboardPointMode,
            maxPlayers: source.maxPlayers,
            minLevel: source.minLevel,
            maxLevel: source.maxLevel,
            minPlayers: source.minPlayers,
            playerCount: source.playerCount,
            prizes: source.prizes ? _.orderBy(source.prizes, p => p.startRank, 'asc').map(p => this.prizeFromEntity(p)) : [],
            public: source.public,
            region: source.region,
            skins: source.skins ? source.skins.map(s => s.id) : [],
            startTime: source.startTime,
            state: source.state,
            type: source.typeId,
            runtime: source.runtime,
            displayPriority: source.displayPriority,
            updateTime: source.updateTime,
            completeTime: source.completeTime,
            durationMins: source.durationMins,
            endTime: source.endTime,
            entryCosts: source.entryCosts ? source.entryCosts.map(c => c.amount) : [],
            entryAllocationCredit: source.entryAllocationCredit,
            entryAllocationRounds: source.entryAllocationRounds,
            maxEntryAllocations: source.maxEntryAllocations,
            entryCutOffTime: source.entryCutOffTime,
            gameColour: source.gameColour,
            nameColour: source.nameColour,
            metadata: source.metadata,
            prizeTotal: source.prizeTotal,
            jackpotTriggers: source.jackpotTriggers ? _.orderBy(source.jackpotTriggers, t => t.threshold, 'desc').map(t => this.jackpotTriggerFromEntity(t)) : [],
            contributionGroups: source.contributionGroups || [],
            introId: source.introId
        };
    }

    public prizeFromEntity(source: TournamentPrizeEntity): RankedPrize {
        if (source instanceof TournamentCashPrizeEntity)
            return {
                type: PrizeType.Cash,
                startRank: source.startRank,
                endRank: source.endRank,
                amount: source.amount,
                currencyCode: source.currencyCode
            };

        if (source instanceof TournamentUpgradePrizeEntity)
            return {
                type: PrizeType.Upgrade,
                startRank: source.startRank,
                endRank: source.endRank,
                level: source.level,
                duration: source.duration
            };

        if (source instanceof TournamentTangiblePrizeEntity)
            return {
                type: PrizeType.Tangible,
                startRank: source.startRank,
                endRank: source.endRank,
                name: source.name,
                shortName: source.shortName,
                imageUrl: source.imageUrl,
                cashAlternativeAmount: source.cashAlternativeAmount
            };

        throw new Error(`Unsupported prize type '${source.type}'.`);
    }

    public prizeToEntity(source: RankedPrize): TournamentPrizeEntity {
        let prize: TournamentCashPrizeEntity | TournamentTangiblePrizeEntity | TournamentUpgradePrizeEntity | undefined;

        switch (source.type) {
            case PrizeType.Cash:
                prize = new TournamentCashPrizeEntity();
                prize.type = PrizeType.Cash;
                prize.currencyCode = source.currencyCode;
                prize.amount = source.amount;
                break;

            case PrizeType.Upgrade:
                prize = new TournamentUpgradePrizeEntity();
                prize.type = PrizeType.Upgrade;
                prize.duration = source.duration;
                prize.level = source.level;
                break;

            case PrizeType.Tangible:
                prize = new TournamentTangiblePrizeEntity();
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

    public entryCostToEntity(amount: number): TournamentEntryCostEntity {
        const entity = new TournamentEntryCostEntity();
        entity.amount = amount;
        return entity;
    }

    public jackpotTriggerFromEntity(source: TournamentJackpotTriggerEntity): JackpotTrigger {
        return {
            jackpotId: source.jackpotId,
            threshold: source.threshold,
            minLevel: source.minLevel,
            final: source.final,
            enabled: source.enabled
        };
    }

    public jackpotTriggerToEntity(source: JackpotTrigger): TournamentJackpotTriggerEntity {
        const entity = new TournamentJackpotTriggerEntity();
        entity.jackpotId = source.jackpotId;
        entity.threshold = source.threshold;
        entity.minLevel = source.minLevel;
        entity.final = source.final;
        entity.enabled = source.enabled;
        return entity;
    }

    public updateToEntity(id: number, update: TournamentUpdate): TournamentEntity {
        const entity = new TournamentEntity();
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
        if (update.startTime) {
            entity.startTime = update.startTime;
            entity.launchTime = moment(update.startTime).subtract(6, 'minutes').toDate();
        }
        if (update.autoPayout !== undefined)
            entity.autoPayout = update.autoPayout;
        if (update.allowJoinAfterStart !== undefined)
            entity.allowJoinAfterStart = update.allowJoinAfterStart;
        if (update.endTime)
            entity.endTime = update.endTime;
        if (update.displayPriority !== undefined)
            entity.displayPriority = update.displayPriority;
        if (update.group)
            entity.group = update.group;
        if (update.entryAllocationCredit !== undefined)
            entity.entryAllocationCredit = update.entryAllocationCredit > 0 ? update.entryAllocationCredit : null as unknown as number;
        if (update.entryAllocationRounds !== undefined)
            entity.entryAllocationRounds = update.entryAllocationRounds > 0 ? update.entryAllocationRounds : null as unknown as number;
        if (update.maxEntryAllocations !== undefined)
            entity.maxEntryAllocations = update.maxEntryAllocations > 0 ? update.maxEntryAllocations : null as unknown as number;
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
        if (update.startTime && update.endTime)
            entity.durationMins = Math.round(moment(update.endTime).diff(update.startTime, 'minutes'));
        else
            entity.durationMins = null as unknown as undefined;
        if (update.contributionGroups !== undefined)
            entity.contributionGroups = update.contributionGroups;
        if (update.gameId)
            entity.gameId = update.gameId;
        if (update.gameMetadataOverride)
            entity.gameMetadataOverride = update.gameMetadataOverride;
        if (update.gamePosition)
            entity.gamePosition = update.gamePosition;
        if (update.entryCutOffTime)
            entity.entryCutOffTime = update.entryCutOffTime;
        if (update.introId !== undefined)
            entity.introId = update.introId === 0 ? null as unknown as undefined : update.introId;

        return entity;
    }

    @LogMethod()
    public async templateToEntity(source: TournamentTemplate, launchTime: Date, startTime: Date): Promise<TournamentEntity> {
        let endTime: Date | undefined;

        if (source.durationMins)
            endTime = moment(startTime).add(source.durationMins, 'minutes').toDate();

        const assignment = await this.gameSelector.select(source);

        const tournament = new TournamentEntity();
        tournament.skins = source.skins.map(s => {
            const skinEntity = new SkinEntity();
            skinEntity.id = s;
            return skinEntity;
        });
        tournament.name = source.name;
        tournament.description = source.description;
        tournament.group = source.group;
        tournament.rules = source.rules;
        tournament.typeId = source.type;
        tournament.runtime = source.runtime;
        tournament.templateId = source.id;
        tournament.displayPriority = source.displayPriority;
        tournament.state = TournamentState.Scheduled;
        tournament.bannerImgUrl = source.bannerImgUrl;
        tournament.minPlayers = source.minPlayers;
        tournament.maxPlayers = source.maxPlayers;
        tournament.autoPayout = source.autoPayout;
        tournament.public = source.public;
        tournament.currencyCode = source.currencyCode;
        tournament.prizeTotal = source.prizeTotal;
        tournament.chatEnabled = source.chatEnabled;
        tournament.chatChannel = source.chatChannel;
        tournament.durationMins = source.durationMins;
        tournament.leaderboardMode = source.leaderboardMode;
        tournament.leaderboardPointConfig = (source.leaderboardPointConfig || null) as LeaderboardPointConfig;
        tournament.leaderboardPointMode = source.leaderboardPointMode;
        tournament.nameColour = source.nameColour;
        tournament.gameColour = source.gameColour;
        tournament.allowedPowerups = source.allowedPowerups;
        tournament.allowJoinAfterStart = source.allowJoinAfterStart;
        tournament.entryAllocationRounds = source.entryAllocationRounds;
        tournament.entryAllocationCredit = source.entryAllocationCredit;
        tournament.maxEntryAllocations = source.maxEntryAllocations;
        tournament.gameId = assignment.gameId;
        tournament.gamePosition = assignment.position;
        tournament.metadata = source.metadata;
        tournament.region = source.region;
        tournament.launchTime = launchTime;
        tournament.startTime = startTime;
        tournament.endTime = endTime;
        tournament.minLevel = source.minLevel;
        tournament.maxLevel = source.maxLevel;
        tournament.contributionGroups = source.contributionGroups;
        tournament.introId = source.introId;

        if (!source.allowJoinAfterStart)
            tournament.entryCutOffTime = moment(startTime).subtract(source.entryCutOff, 'seconds').toDate();
        else if (endTime)
            tournament.entryCutOffTime = moment(endTime).subtract(source.entryCutOff, 'seconds').toDate();
        else
            tournament.entryCutOffTime = startTime;

        if (assignment.metadataOverride)
            tournament.gameMetadataOverride = assignment.metadataOverride;

        if (source.prizes && source.prizes.length > 0)
            tournament.prizes = source.prizes.map(p => this.prizeToEntity(p));

        if (source.entryCosts && source.entryCosts.length > 0)
            tournament.entryCosts = source.entryCosts.map(c => this.entryCostToEntity(c));

        if (source.jackpotTriggers && source.jackpotTriggers.length > 0)
            tournament.jackpotTriggers = source.jackpotTriggers.map(t => this.jackpotTriggerToEntity(t));

        return tournament;
    }
}
