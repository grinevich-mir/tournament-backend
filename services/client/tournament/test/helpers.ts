import { TournamentLeaderboardMode, Tournament, TournamentState, TournamentType, TournamentEntry, TournamentLeaderboardPointMode, TournamentRuntimeType } from '@tcom/platform/lib/tournament';
import _ = require('lodash');
import { TournamentModel, TournamentEntryModel, UserTournamentModel } from '@tcom/platform/lib/tournament/models';
import { GameOrientation, GameProvider, GameType } from '@tcom/platform/lib/game';
import { PagedResult } from '@tcom/platform/lib/core';

export function generateTournament(id: number = 1): Tournament {
    return {
        id,
        name: `Tournament ${id}`,
        public: true,
        playerCount: 1,
        region: 'us-east-1',
        skins: ['tournament'],
        state: TournamentState.Scheduled,
        type: TournamentType.Slot,
        runtime: TournamentRuntimeType.Fargate,
        displayPriority: 1,
        prizes: [],
        gameMetadataOverride: {},
        minLevel: 0,
        allowJoinAfterStart: false,
        allowedPowerups: [],
        autoPayout: false,
        bannerImgUrl: 'https://an-image-url.com/image.jpg',
        chatEnabled: false,
        currencyCode: 'USD',
        description: `Test Tournament ${id}`,
        gameId: 1,
        gamePosition: 1,
        enabled: true,
        templateId: 1,
        entryCosts: [],
        entryCutOffTime: new Date(),
        startTime: new Date(),
        leaderboardMode: TournamentLeaderboardMode.Visible,
        leaderboardPointMode: TournamentLeaderboardPointMode.Cumulative,
        jackpotTriggers: [],
        minPlayers: 1,
        maxPlayers: 5000,
        introId: 1,
        launchTime: new Date(),
        createTime: new Date(),
        updateTime: new Date()
    };
}

export function generateTournaments(count: number): Tournament[] {
    return _.range(count).map(index => generateTournament(index + 1));
}

export function generatePagedTournaments(count: number, page: number, pageSize: number, totalCount?: number): PagedResult<Tournament> {
    const tournaments = generateTournaments(count);
    return new PagedResult(tournaments, totalCount || count, page, pageSize);
}

export function generateTournamentModel(id: number = 1): TournamentModel {
    return {
        id,
        name: `Tournament ${id}`,
        public: true,
        playerCount: 1,
        region: 'us-east-1',
        skins: ['tournament'],
        state: TournamentState.Scheduled,
        type: TournamentType[TournamentType.Slot],
        displayPriority: 1,
        prizes: [],
        minLevel: 0,
        allowJoinAfterStart: false,
        allowedPowerups: [],
        autoPayout: false,
        bannerImgUrl: 'https://an-image-url.com/image.jpg',
        chatEnabled: false,
        currencyCode: 'USD',
        description: `Test Tournament ${id}`,
        game: {
            id: 1,
            name: 'Game 1',
            provider: GameProvider[GameProvider.Revolver],
            thumbnail: 'https://an-image-url/game.jpg',
            orientation: GameOrientation.All,
            type: GameType[GameType.Slot]
        },
        enabled: true,
        templateId: 1,
        startTime: new Date(),
        entryCutOffTime: new Date(),
        leaderboardMode: TournamentLeaderboardMode.Visible,
        leaderboardProgress: false,
        leaderboardPointMode: TournamentLeaderboardPointMode.Cumulative,
        jackpotTriggers: [],
        entryCosts: [],
        minPlayers: 1,
        maxPlayers: 5000,
        launchTime: new Date(),
        createTime: new Date(),
        updateTime: new Date()
    };
}

export function generateUserTournamentModel(id: number = 1): UserTournamentModel {
    const model = generateTournamentModel(id);
    return {
        ...model,
        playerJoined: false,
        playerKnockedOut: false,
        playerCompleted: false,
        playerAllocations: 0,
        playerAllocationsComplete: 0,
        playerAllocationsRemaining: undefined,
        playerEntryCost: 0
    };
}

export function generateTournamentModels(count: number): TournamentModel[] {
    return _.range(count).map(index => generateTournamentModel(index + 1));
}

export function generateUserTournamentModels(count: number): UserTournamentModel[] {
    return _.range(count).map(index => generateUserTournamentModel(index + 1));
}

export function generatePagedTournamentModels(count: number, page: number, pageSize: number, totalCount?: number): PagedResult<TournamentModel> {
    const tournaments = generateTournamentModels(count);
    return new PagedResult(tournaments, totalCount || count, page, pageSize);
}

export function generateTournamentEntry(id: number, userId: number): TournamentEntry {
    return {
        id,
        userId,
        token: 'CrfEfgtSffdC',
        tournamentId: 1,
        knockedOut: false,
        totalCost: 0,
        allocations: [
            {
                id: 1,
                entryId: 1,
                complete: false,
                cost: 0,
                createTime: new Date(),
                updateTime: new Date()
            },
            {
                id: 2,
                entryId: 1,
                complete: false,
                cost: 0,
                createTime: new Date(),
                updateTime: new Date()
            }
        ],
        prizes: [],
        activatedTime: new Date(),
        createTime: new Date(),
        updateTime: new Date()
    };
}

export function generateTournamentEntryModel(id: number, userId: number): TournamentEntryModel {
    return {
        id,
        userId,
        token: 'CrfEfgtSffdC',
        tournamentId: 1,
        complete: false,
        prizes: [],
        activated: true,
        allocationsComplete: 0,
        allocations: 0,
        totalCost: 0,
        createTime: new Date(),
        updateTime: new Date()
    };
}