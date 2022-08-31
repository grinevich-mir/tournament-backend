import { Leaderboard } from '../leaderboard';
import { LeaderboardModel, LeaderboardEntryModel } from './leaderboard.model';
import { LeaderboardEntry } from '../leaderboard-entry';
import { Singleton } from '../../core/ioc';

@Singleton
export class LeaderboardModelMapper {
    public map(source: Leaderboard, userId?: number): LeaderboardModel {
        return {
            id: source.id,
            type: source.type,
            prizes: source.prizes,
            entryCount: source.entryCount,
            entries: source.entries.map(p => this.mapEntry(p, userId)),
            userEntry: source.userEntry ? this.mapEntry(source.userEntry) : undefined
        };
    }

    public mapEntry(entry: LeaderboardEntry, userId?: number): LeaderboardEntryModel {
        return {
            rank: entry.rank,
            points: entry.points,
            runningPoints: entry.runningPoints,
            displayName: entry.displayName,
            country: entry.country,
            avatarUrl: entry.avatarUrl,
            isPlayer: entry.userId === userId,
            active: entry.active,
        };
    }
}