import { Singleton, Inject, IocContainer } from '@tcom/platform/lib/core/ioc';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { TournamentEntryManager } from '@tcom/platform/lib/tournament';

interface RestoreEvent {
    tournamentId: number;
}

@Singleton
@LogClass()
class RestoreEntriesCacheHandler {
    constructor(
        @Inject private readonly entryManager: TournamentEntryManager) {
        }

    public async execute(event: RestoreEvent): Promise<void> {
        if (!event.tournamentId)
            throw new Error('Tournament ID not supplied.');

        Logger.info(`Restoring Tournament ${event.tournamentId} Entries Cache...`);
        await this.entryManager.restoreCache(event.tournamentId);
        Logger.info('Entries Cache restored.');
    }
}

export const restoreEntriesCache = lambdaHandler((event: RestoreEvent) => IocContainer.get(RestoreEntriesCacheHandler).execute(event));