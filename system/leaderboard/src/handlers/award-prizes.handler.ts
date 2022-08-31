import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler, JsonSerialiser } from '@tcom/platform/lib/core';
import { SQSEvent } from 'aws-lambda';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { LeaderboardPrizeAward } from '@tcom/platform/lib/leaderboard';
import { LeaderboardPrizeProcessorFactory } from '@tcom/platform/lib/leaderboard/prizes';

@Singleton
@LogClass()
class AwardPrizesHandler {
    constructor(
        @Inject private readonly processorFactory: LeaderboardPrizeProcessorFactory,
        @Inject private readonly serialiser: JsonSerialiser) {
        }

    public async execute(event: SQSEvent): Promise<void> {
        for (const record of event.Records) {
            const item = this.serialiser.deserialise<LeaderboardPrizeAward>(record.body);
            await this.award(item);
        }
    }

    private async award(item: LeaderboardPrizeAward) {
        for (const prize of item.prizes) {
            Logger.debug('Awarding Prize', {
                leaderboardId: item.leaderboardId,
                userId: item.userId,
                prize
            });
            const processor = this.processorFactory.create(prize.type);
            await processor.process(item.leaderboardId, item.userId, prize);
        }
    }
}

export const awardPrizes = lambdaHandler((event: SQSEvent) => IocContainer.get(AwardPrizesHandler).execute(event));