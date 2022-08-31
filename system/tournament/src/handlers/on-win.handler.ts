import { Singleton, Inject, IocContainer } from '@tcom/platform/lib/core/ioc';
import { TournamentWinnerManager, } from '@tcom/platform/lib/tournament';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { TournamentWinEvent } from '@tcom/platform/lib/tournament/events';
import { PrizeType, Prize, CashPrize } from '@tcom/platform/lib/prize';
import { SNSEvent } from 'aws-lambda';
import { LogClass } from '@tcom/platform/lib/core/logging';
import _ from 'lodash';

@Singleton
@LogClass()
class OnTournamentWinHandler extends PlatformEventHandler<TournamentWinEvent> {
    constructor(
        @Inject private readonly winnerManager: TournamentWinnerManager) {
            super();
    }

    public async process(event: Readonly<TournamentWinEvent>): Promise<void> {
        if (!event.prizes)
            return;

        const cashPrizes = event.prizes.filter(p => p.type === PrizeType.Cash && p.currencyCode !== 'DIA') as CashPrize[];

        if (cashPrizes.length === 0)
            return;

        const prize: Prize = {
            type: PrizeType.Cash,
            currencyCode: cashPrizes[0].currencyCode,
            amount: _.sumBy(cashPrizes, p => p.amount)
        };

        await this.winnerManager.add(event.entryId, prize);
    }
}

export const onWin = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentWinHandler).execute(event));