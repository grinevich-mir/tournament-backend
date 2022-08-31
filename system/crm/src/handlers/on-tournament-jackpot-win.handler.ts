import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentJackpotWinEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMManager } from '@tcom/platform/lib/crm';
import _ from 'lodash';
import { UserManager, UserType } from '@tcom/platform/lib/user';
import { CRMEventType } from '../crm-event-type';

@Singleton
@LogClass()
class OnTournamentJackpotWinHandler extends PlatformEventHandler<TournamentJackpotWinEvent> {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly crmManager: CRMManager) {
            super();
    }

    protected async process(event: Readonly<TournamentJackpotWinEvent>): Promise<void> {
        const user = await this.userManager.get(event.payout.userId);

        if (!user || user.type === UserType.Bot)
            return;

        await this.crmManager.updateContact(event.payout.userId, {
            hasTournamentJackpotWin: true,
            lastTournamentJackpotWin: new Date(event.timestamp)
        });

        await this.crmManager.addEvent(event.payout.userId, CRMEventType.TournamentJackpotWin, {
            tournamentId: event.tournamentId,
            jackpotId: event.payout.jackpotId,
            threshold: event.trigger.threshold,
            amount: event.payout.amount,
            winnerCount: event.winnerCount
        });
    }
}

export const onTournamentJackpotWin = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentJackpotWinHandler).execute(event));