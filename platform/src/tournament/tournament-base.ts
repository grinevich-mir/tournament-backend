import { Region } from '../core';
import { TournamentType } from './tournament-type';
import { TournamentLeaderboardMode } from './tournament-leaderboard-mode';
import { LeaderboardPointConfig } from '../leaderboard';
import { PowerupType } from '../powerup';
import { TournamentMetadata } from './tournament-metadata';
import { TournamentLeaderboardPointMode } from './tournament-leaderboard-point-mode';
import { JackpotTrigger } from '../jackpot';
import { TournamentRuntimeType } from './tournament-runtime-type';
import { RankedPrize } from '../prize';

export interface TournamentBase {
    id: number;
    name: string;
    description: string;
    group?: string;
    rules?: string;
    region: Region;
    type: TournamentType;
    runtime: TournamentRuntimeType;
    displayPriority: number;
    bannerImgUrl: string;
    skins: string[];
    currencyCode: string;
    prizes: RankedPrize[];
    prizeTotal?: number;
    minPlayers: number;
    maxPlayers: number;
    autoPayout: boolean;
    public: boolean;
    leaderboardId?: number;
    leaderboardMode: TournamentLeaderboardMode;
    leaderboardPointConfig?: LeaderboardPointConfig;
    leaderboardPointMode: TournamentLeaderboardPointMode;
    chatEnabled: boolean;
    chatChannel?: string;
    durationMins?: number;
    nameColour?: string;
    gameColour?: string;
    allowedPowerups: PowerupType[];
    allowJoinAfterStart: boolean;
    entryCosts: number[];
    entryAllocationRounds?: number;
    entryAllocationCredit?: number;
    maxEntryAllocations?: number;
    metadata?: TournamentMetadata;
    minLevel: number;
    maxLevel?: number;
    jackpotTriggers: JackpotTrigger[];
    contributionGroups?: string[];
    introId?: number;
    createTime: Date;
    updateTime: Date;
}