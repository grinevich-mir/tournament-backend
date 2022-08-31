import { Singleton, Inject, IocContainer } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LeaderboardManager } from '@tcom/platform/lib/leaderboard';

interface RestoreEvent {
    leaderboardId: number;
    restoreEntries?: boolean;
}

@Singleton
@LogClass()
class RestoreCacheHandler {
    constructor(
        @Inject private readonly leaderboardManager: LeaderboardManager) {
        }

    public async execute(event: RestoreEvent): Promise<void> {
        if (!event.leaderboardId)
            throw new Error('Leaderboard ID not supplied.');

        Logger.info(`Restoring Leaderboard ${event.leaderboardId}...`);
        await this.leaderboardManager.restoreCache(event.leaderboardId, event.restoreEntries);
        Logger.info('Leaderboard restored.');
    }
}

export const restoreCache = lambdaHandler((event: RestoreEvent) => IocContainer.get(RestoreCacheHandler).execute(event));