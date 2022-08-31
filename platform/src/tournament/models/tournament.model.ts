import { PowerupType } from '../../powerup';
import { GameModel } from '../../game/models';
import { TournamentMetadata } from '../tournament-metadata';
import { TournamentState } from '../tournament-state';
import { TournamentLeaderboardMode } from '../tournament-leaderboard-mode';
import { TournamentLeaderboardPointMode } from '../tournament-leaderboard-point-mode';
import { RankedPrize } from '../../prize';
import { JackpotTrigger } from '../../jackpot';

export interface TournamentModel {
    /**
     * @isInt id
     */
    id: number;
    /**
     * @isInt templateId
     */
    templateId: number;
    skins: string[];
    name: string;
    description: string;
    group?: string;
    rules?: string;
    metadata?: TournamentMetadata;
    type: string;
    /**
     * @isInt displayPriority
     */
    displayPriority: number;
    /**
     * @isInt state
     */
    state: TournamentState;
    bannerImgUrl: string;
    /**
     * @isInt minPlayers
     */
    minPlayers: number;
    /**
     * @isInt maxPlayers
     */
    maxPlayers: number;
    /**
     * @isInt playerCount
     */
    playerCount: number;
    autoPayout: boolean;
    currencyCode: string;
    prizes: RankedPrize[];
    prizeTotal?: number;
    public: boolean;
    leaderboardMode: TournamentLeaderboardMode;
    leaderboardId?: number;
    leaderboardProgress: boolean;
    leaderboardPointMode: TournamentLeaderboardPointMode;
    jackpotTriggers: JackpotTrigger[];
    chatEnabled: boolean;
    maxEntryAllocations?: number;
    /**
     * @isInt durationMins
     */
    durationMins?: number;
    nameColour?: string;
    gameColour?: string;
    allowJoinAfterStart: boolean;
    allowedPowerups: PowerupType[];
    entryCosts: number[];
    game: GameModel;
    enabled: boolean;
    region: string;
    launchTime: Date;
    entryCutOffTime: Date;
    startTime: Date;
    endTime?: Date;
    minLevel: number;
    maxLevel?: number;
    introId?: number;
    createTime: Date;
    updateTime: Date;
}
