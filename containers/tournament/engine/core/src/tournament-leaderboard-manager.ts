import { Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { TournamentLeaderboardPosition } from './models';
import { LeaderboardManager, LeaderboardEntry } from '@tcom/platform/lib/leaderboard';
import { Context } from './context';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { TournamentEntryManager } from '@tcom/platform/lib/tournament';

@Singleton
@LogClass()
export class TournamentLeaderboardManager {
    private leaderboardId!: number;

    constructor(
        @Inject private readonly context: Context,
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly entryManager: TournamentEntryManager) {
    }

    public async getPositions(max: number = 0): Promise<TournamentLeaderboardPosition[]> {
        const entries = await this.leaderboardManager.getEntriesByRank(this.leaderboardId, 1, max);
        return this.mapModels(entries);
    }

    public async getPositionsByPoints(min: number | string, max: number | string): Promise<TournamentLeaderboardPosition[]> {
        const entries = await this.leaderboardManager.getEntriesByPoints(this.leaderboardId, min, max);
        return this.mapModels(entries);
    }

    public async knockoutByPoints(minPoints: number): Promise<number> {
        const [knockedOutEntries, remainingCount] = await this.leaderboardManager.knockoutByPoints(this.leaderboardId, minPoints);

        for (const entry of knockedOutEntries)
            await this.entryManager.setKnockedOut(this.context.tournamentId, entry.userId, true);

        return remainingCount;
    }

    public async start(leaderboardId: number): Promise<void> {
        this.leaderboardId = leaderboardId;
    }

    public async shutdown(): Promise<void> {
    }

    private async mapModels(leaderboardEntries: LeaderboardEntry[], knockedOut: boolean = false): Promise<TournamentLeaderboardPosition[]> {
        if (!leaderboardEntries || leaderboardEntries.length === 0)
            return [];

        const entries = await this.entryManager.getMultiple(this.context.tournamentId, leaderboardEntries.map(p => p.userId));

        const models: TournamentLeaderboardPosition[] = [];

        for (const leaderboardEntry of leaderboardEntries) {
            const entry = entries.find(e => e.userId === leaderboardEntry.userId);

            if (!entry)
                continue;

            models.push({
                userId: leaderboardEntry.userId,
                rank: leaderboardEntry.rank,
                points: leaderboardEntry.points,
                entryId: entry.id,
                knockedOut: knockedOut || entry.knockedOut
            });
        }

        return models;
    }
}