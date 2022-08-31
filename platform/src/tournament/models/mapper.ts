import { Singleton, Inject } from '../../core/ioc';
import { TournamentEntryModel } from './tournament-entry.model';
import { TournamentModel } from './tournament.model';
import { UserTournamentModel } from './user-tournament.model';
import _ from 'lodash';
import { GameModelMapper } from '../../game/models';
import { PrizeType, Prize, CashPrize, TangiblePrize } from '../../prize';
import { Tournament } from '../tournament';
import { TournamentType } from '../tournament-type';
import { UserTournament } from '../user-tournament';
import { TournamentEntry } from '../tournament-entry';
import { GameManager } from '../../game';
import { TournamentWinnerModel } from './tournament-winner.model';
import { TournamentWinner } from '../tournament-winner';
import { LogMethod } from '../../core/logging';
import { TournamentLeaderboardMode } from '../tournament-leaderboard-mode';
import { User } from '../../user';
import { AvatarUrlResolver } from '../../user/utilities';

@Singleton
export class TournamentModelMapper {
    constructor(
        @Inject private readonly gameManager: GameManager,
        @Inject private readonly gameMapper: GameModelMapper,
        @Inject private readonly avatarUrlResolver: AvatarUrlResolver) {
    }

    @LogMethod()
    public async mapAll(source: Tournament[]): Promise<TournamentModel[]> {
        const models: TournamentModel[] = [];

        for (const tournament of source)
            models.push(await this.map(tournament));

        return models;
    }

    @LogMethod()
    public async map(source: Tournament): Promise<TournamentModel> {
        const game = await this.gameManager.get(source.gameId);

        if (!game)
            throw new Error(`Game ${source.gameId} not found.`);

        return {
            id: source.id,
            skins: source.skins,
            name: source.name,
            description: source.description,
            group: source.group,
            rules: source.rules,
            metadata: source.metadata,
            templateId: source.templateId,
            game: this.gameMapper.map(game, source.gameMetadataOverride),
            type: TournamentType[source.type],
            displayPriority: source.displayPriority,
            chatEnabled: source.chatEnabled,
            gameColour: source.gameColour,
            nameColour: source.nameColour,
            autoPayout: source.autoPayout,
            public: source.public,
            leaderboardMode: source.leaderboardMode,
            leaderboardId: source.leaderboardId,
            leaderboardProgress: source.leaderboardMode !== TournamentLeaderboardMode.Disabled && !!source.leaderboardPointConfig,
            leaderboardPointMode: source.leaderboardPointMode,
            jackpotTriggers: source.jackpotTriggers ? source.jackpotTriggers.filter(t => t.enabled) : [],
            bannerImgUrl: source.bannerImgUrl,
            allowJoinAfterStart: source.allowJoinAfterStart,
            allowedPowerups: source.allowedPowerups,
            enabled: source.enabled,
            durationMins: source.durationMins,
            currencyCode: source.currencyCode,
            entryCosts: source.entryCosts,
            prizes: source.prizes,
            prizeTotal: source.prizeTotal,
            state: source.state,
            minPlayers: source.minPlayers,
            maxPlayers: source.maxPlayers,
            minLevel: source.minLevel,
            maxLevel: source.maxLevel,
            region: source.region,
            launchTime: source.launchTime,
            startTime: source.startTime,
            endTime: source.endTime,
            entryCutOffTime: source.entryCutOffTime,
            playerCount: source.playerCount,
            maxEntryAllocations: source.maxEntryAllocations,
            introId: source.introId,
            createTime: source.createTime,
            updateTime: source.updateTime,
        };
    }

    @LogMethod()
    public async mapAllForUser(source: UserTournament[]): Promise<UserTournamentModel[]> {
        const models: UserTournamentModel[] = [];

        for (const tournament of source)
            models.push(await this.mapForUser(tournament));

        return models;
    }

    public async mapForUser(source: UserTournament): Promise<UserTournamentModel> {
        const tournament = await this.map(source) as UserTournamentModel;

        if (!source.entry)
            return tournament;

        const entry = source.entry;
        this.mapAllocationInfo(tournament, entry);
        tournament.playerTotalCost = entry.totalCost;

        if (entry.prizes && entry.prizes.length > 0) {
            const cashPrizes = entry.prizes.filter(p => p.type === PrizeType.Cash) as CashPrize[];
            const tangiblePrizes = entry.prizes.filter(p => p.type === PrizeType.Tangible) as TangiblePrize[];

            if (cashPrizes.length > 0) {
                const prize: Prize = {
                    type: PrizeType.Cash,
                    amount: _.sumBy(cashPrizes, p => p.amount),
                    currencyCode: cashPrizes[0].currencyCode
                };

                tournament.userPrize = prize;
            }

            if (tangiblePrizes.length > 0) {
                const prize: Prize = {
                    type: PrizeType.Tangible,
                    name: tangiblePrizes[0].name,
                    shortName: tangiblePrizes[0].shortName,
                    imageUrl: tangiblePrizes[0].imageUrl,
                    cashAlternativeAmount: tangiblePrizes[0].cashAlternativeAmount,
                };

                tournament.userPrize = prize;
            }
        }

        return tournament;
    }

    public mapAllocationInfo(source: UserTournamentModel, entry?: TournamentEntry): void {
        source.playerJoined = false;
        source.playerKnockedOut = false;
        source.playerCompleted = false;
        source.playerAllocations = 0;
        source.playerAllocationsComplete = 0;
        source.playerAllocationsRemaining = source.maxEntryAllocations;
        source.playerEntryCost = source.entryCosts ? source.entryCosts[0] ?? 0 : 0;

        if (!entry)
            return;

        let totalAllocations = 0;
        let completedAllocations = 0;
        let remainingAllocations: number | undefined;

        if (entry.allocations && entry.allocations.length > 0) {
            totalAllocations = entry.allocations.length;
            completedAllocations = entry.allocations.filter(a => a.complete).length;

            if (source.maxEntryAllocations)
                remainingAllocations = source.maxEntryAllocations - completedAllocations;
        }

        source.playerJoined = true;
        source.playerKnockedOut = entry.knockedOut;
        source.playerCompleted = remainingAllocations !== undefined ? remainingAllocations === 0 : false;
        source.playerAllocations = totalAllocations;
        source.playerAllocationsComplete = completedAllocations;
        source.playerAllocationsRemaining = remainingAllocations;
        const cost = source.entryCosts ? source.entryCosts[entry.allocations.length] ?? _.last(source.entryCosts) : 0;
        source.playerEntryCost = cost;
        source.playerTotalCost = entry.totalCost;
    }

    public mapEntries(source: TournamentEntry[]): TournamentEntryModel[] {
        return source.map(e => this.mapEntry(e));
    }

    public mapEntry(source: TournamentEntry): TournamentEntryModel {
        let rounds: number | undefined;
        let credit: number | undefined;

        if (source.allocations) {
            const currentAllocation = _.chain(source.allocations)
                .filter(a => !a.complete)
                .sortBy(a => a.createTime)
                .first()
                .value();

            if (currentAllocation) {
                rounds = currentAllocation.rounds;
                credit = currentAllocation.credit;
            }
        }

        const model: TournamentEntryModel = {
            id: source.id,
            tournamentId: source.tournamentId,
            userId: source.userId,
            token: source.token,
            rounds,
            credit,
            allocations: source.allocations ? source.allocations.length : 0,
            allocationsComplete: source.allocations ? source.allocations.filter(a => a.complete).length : 0,
            complete: source.allocations ? source.allocations.every(a => a.complete) : false,
            totalCost: source.totalCost,
            activated: !!source.activatedTime,
            createTime: source.createTime,
            updateTime: source.updateTime
        };

        if (source.prizes && source.prizes.length)
            model.prizes = source.prizes;

        return model;
    }

    public mapWinner(winner: TournamentWinner, user: User | undefined): TournamentWinnerModel {
        return {
            id: winner.id,
            displayName: user?.displayName || 'Anonymous',
            country: user?.country || 'US',
            avatarUrl: user ? this.avatarUrlResolver.resolve(user) : undefined,
            date: winner.date,
            prize: winner.prize,
            tournamentId: winner.tournamentId,
            tournamentName: winner.tournamentName,
            tournamentType: TournamentType[winner.tournamentType],
            isPlayer: false
        };
    }
}
