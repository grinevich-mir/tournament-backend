import { TournamentMetadata } from './tournament-metadata';

export interface TournamentUpdateBase {
    name?: string;
    allowJoinAfterStart?: boolean;
    description?: string;
    bannerImgUrl?: string;
    autoPayout?: boolean;
    rules?: string;
    minLevel?: number;
    maxLevel?: number;
    group?: string;
    entryAllocationCredit?: number;
    entryAllocationRounds?: number;
    maxEntryAllocations?: number;
    minPlayers?: number;
    maxPlayers?: number;
    metadata?: TournamentMetadata;
    public?: boolean;
    enabled?: boolean;
    prizeTotal?: number;
    displayPriority?: number;
    contributionGroups?: string[];
    introId?: number;
}