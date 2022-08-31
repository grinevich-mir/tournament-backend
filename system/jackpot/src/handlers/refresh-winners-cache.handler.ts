import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { JackpotWinnerManager } from '@tcom/platform/lib/jackpot';

@Singleton
@LogClass()
class RefreshWinnersCacheHandler {
    constructor(
        @Inject private readonly manager: JackpotWinnerManager) {
    }

    public async execute(): Promise<void> {
        const winners = await this.manager.refreshCache();
        Logger.info('Finished refreshing winners cache', winners);
    }
}

export const refreshWinnersCache = lambdaHandler(() => IocContainer.get(RefreshWinnersCacheHandler).execute());