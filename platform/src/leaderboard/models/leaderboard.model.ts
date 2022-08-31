import { RankedPrize } from '../../prize';

export interface LeaderboardModel {
    /**
     * @isInt id
     */
    id: number;
    type: string;
    prizes: RankedPrize[];
    /**
     * @isInt entryCount
     */
    entryCount: number;
    entries: LeaderboardEntryModel[];
    userEntry?: LeaderboardEntryModel;
}

export interface LeaderboardEntryModel {
    /**
     * @isInt rank
     */
    rank: number;
    displayName: string;
    avatarUrl?: string;
    country: string;
    points: number;
    runningPoints: number;
    isPlayer: boolean;
    active?: boolean;
}
