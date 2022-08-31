import { Singleton, Inject, IocContainer } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LeaderboardCache } from '@tcom/platform/lib/leaderboard/cache';
import { LeaderboardRepository } from '@tcom/platform/lib/leaderboard/repositories';
import { LeaderboardEntryEntity } from '@tcom/platform/lib/leaderboard/entities';

interface SaveEntriesEvent {
    leaderboardId: number;
}

@Singleton
@LogClass()
class SaveEntriesHandler {
    constructor(
        @Inject private readonly leaderboardRepository: LeaderboardRepository,
        @Inject private readonly leaderboardCache: LeaderboardCache) {
        }

    public async execute(event: SaveEntriesEvent): Promise<void> {
        if (!event.leaderboardId)
            throw new Error('Leaderboard ID not supplied.');

        const leaderboard = await this.leaderboardCache.getInfo(event.leaderboardId);

        if (!leaderboard)
            throw new Error('Leaderboard not available in cache.');

        const entries = await this.leaderboardCache.getEntriesByRank(event.leaderboardId);

        const entities: LeaderboardEntryEntity[] = [];

        for (const entry of entries) {
            const entity = new LeaderboardEntryEntity();
            entity.userId = entry.userId;
            entity.leaderboardId = event.leaderboardId;
            entity.rank = entry.rank;
            entity.points = entry.points;
            entity.tieBreaker = entry.tieBreaker;
            entity.runningPoints = entry.runningPoints;
            entity.runningTieBreaker = entry.runningTieBreaker;
            entities.push(entity);
        }

        if (entities.length === 0) {
            Logger.info('Nothing to save.');
            return;
        }

        Logger.info(`Saving ${entities.length} entries...`);
        await this.leaderboardRepository.saveEntries(entities);
        Logger.info('Entries saved.');
        Logger.info('Updating ranks...');
        await this.leaderboardRepository.updateRanks(event.leaderboardId);
    }
}

export const saveEntries = lambdaHandler((event: SaveEntriesEvent) => IocContainer.get(SaveEntriesHandler).execute(event));