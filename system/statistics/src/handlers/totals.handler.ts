import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { StatisticsRepository } from '@tcom/platform/lib/statistics/repositories';
import { TotalsCache } from '@tcom/platform/lib/statistics/cache';

@Singleton
@LogClass()
class TopWinnersHandler {
    constructor(
        @Inject private readonly repository: StatisticsRepository,
        @Inject private readonly cache: TotalsCache) {
    }

    public async execute(): Promise<void> {
        const data = await this.repository.getTotals();
        await this.cache.store(data);
    }
}

export const generateTotals = lambdaHandler(() => IocContainer.get(TopWinnersHandler).execute());