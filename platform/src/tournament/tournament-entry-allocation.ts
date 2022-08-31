export interface TournamentEntryAllocation {
    id: number;
    entryId: number;
    rounds?: number;
    credit?: number;
    cost: number;
    complete: boolean;
    createTime: Date;
    updateTime: Date;
}