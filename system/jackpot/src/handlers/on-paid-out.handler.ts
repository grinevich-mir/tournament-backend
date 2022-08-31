import { SNSEvent } from 'aws-lambda';
import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { JackpotPaidOutEvent } from '@tcom/platform/lib/jackpot/events';
import { JackpotWinnerManager } from '@tcom/platform/lib/jackpot';

@Singleton
@LogClass()
class OnPaidOutHandler extends PlatformEventHandler<JackpotPaidOutEvent> {
    constructor(
        @Inject private readonly jackpotWinnerManager: JackpotWinnerManager) {
            super();
    }

    protected async process(event: Readonly<JackpotPaidOutEvent>): Promise<void> {
        for (const payout of event.payouts)
            await this.jackpotWinnerManager.add(payout);
    }
}

export const onPaidOut = lambdaHandler((event: SNSEvent) => IocContainer.get(OnPaidOutHandler).execute(event));