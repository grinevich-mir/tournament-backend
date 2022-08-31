import { NewTournamentEntryAllocation } from './new-tournament-entry-allocation';

export interface TournamentEntryAllocationUpdate extends NewTournamentEntryAllocation {
    complete?: boolean;
}