import { Inject, IocContainer, Singleton } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { StatisticsRepository } from '@tcom/platform/lib/statistics/repositories';
import { BigWinsCache } from '@tcom/platform/lib/statistics/cache';

@Singleton
@LogClass()
class BigWinsHandler {
    constructor(
        @Inject private readonly statisticsRepository: StatisticsRepository,
        @Inject private readonly bigWinsCache: BigWinsCache) { }

    public async execute(): Promise<void> {
        const winners = await this.statisticsRepository.getBigWins();
        for (const winner of winners)
            await this.bigWinsCache.store(winner);
    }

}

export const generateBigWins = lambdaHandler(() => IocContainer.get(BigWinsHandler).execute());