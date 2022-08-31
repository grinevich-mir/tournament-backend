import { Inject, Singleton, IocContainer } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { TournamentManager } from '@tcom/platform/lib/tournament';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Singleton
@LogClass()
class RefreshCacheHandler {
    constructor(
        @Inject private readonly manager: TournamentManager) {
    }

    public async refresh(): Promise<void> {
        await this.manager.refreshCache();
        console.log('Tournament cache updated.');
    }
}

export const refreshCache = lambdaHandler(() => IocContainer.get(RefreshCacheHandler).refresh());