import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { StatisticsRepository } from '@tcom/platform/lib/statistics/repositories';
import { TopWinnersCache } from '@tcom/platform/lib/statistics/cache';

const count = 100;

@Singleton
@LogClass()
class TopWinnersHandler {
    constructor(
        @Inject private readonly repository: StatisticsRepository,
        @Inject private readonly cache: TopWinnersCache) {
    }

    public async execute(): Promise<void> {
        const winners = await this.repository.getTopWinners(count);
        await this.cache.store(winners);
    }

}

export const generateTopWinners = lambdaHandler(() => IocContainer.get(TopWinnersHandler).execute());