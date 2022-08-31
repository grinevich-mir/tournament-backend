import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { StatisticsRepository } from '@tcom/platform/lib/statistics/repositories';
import { TopWinnersCache } from '@tcom/platform/lib/statistics/cache';

const count = 100;
const days = 30;

@Singleton
@LogClass()
class TopWinners30DaysHandler {
    constructor(
        @Inject private readonly repository: StatisticsRepository,
        @Inject private readonly cache: TopWinnersCache) {
    }

    public async execute(): Promise<void> {
        const cacheSuffix = '30Days';
        const winners = await this.repository.getTopWinnersDays(days, count);
        await this.cache.store(winners, cacheSuffix);
    }

}

export const generateTopWinners30Days = lambdaHandler(() => IocContainer.get(TopWinners30DaysHandler).execute());