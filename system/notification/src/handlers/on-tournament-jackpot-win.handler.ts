import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentJackpotWinEvent } from '@tcom/platform/lib/tournament/events';
import { Tournament, TournamentManager } from '@tcom/platform/lib/tournament';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { formatMoney } from '@tcom/platform/lib/banking/utilities';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMSender, CRMMessageData, CRMTemplateName } from '@tcom/platform/lib/crm';
import _ from 'lodash';
import { UserManager, UserNotificationType } from '@tcom/platform/lib/user';
import { NotificationManager, NotificationType } from '@tcom/platform/lib/notification';
import { Jackpot, JackpotManager } from '@tcom/platform/lib/jackpot';

@Singleton
@LogClass()
class OnTournamentJackpotWinHandler extends PlatformEventHandler<TournamentJackpotWinEvent> {
    constructor(
        @Inject private readonly notificationManager: NotificationManager,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly jackpotManager: JackpotManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly crmSender: CRMSender) {
            super();
    }

    protected async process(event: Readonly<TournamentJackpotWinEvent>): Promise<void> {
        const tournament = await this.tournamentManager.get(event.tournamentId);

        if (!tournament) {
            Logger.error(`Tournament ${event.tournamentId} not found.`);
            return;
        }

        const payout = event.payout;
        const jackpot = await this.jackpotManager.get(payout.jackpotId);

        if (!jackpot) {
            Logger.error(`Jackpot ${payout.jackpotId} not found.`);
            return;
        }

        const data: any = {
            tournamentName: tournament.name,
            tournamentId: tournament.id,
            jackpotName: jackpot.name,
            jackpotLabel: jackpot.label,
            jackpotType: jackpot.type,
            amount: payout.amount,
            threshold: event.trigger.threshold,
            winnerCount: event.winnerCount
        };

        await this.notificationManager.add(NotificationType.TournamentJackpotWin, data, event.payout.userId);

        if (!await this.userManager.isOnline(payout.userId))
            await this.sendMessage(tournament, jackpot, event);
    }

    private async sendMessage(tournament: Tournament, jackpot: Jackpot, event: Readonly<TournamentJackpotWinEvent>): Promise<void> {
        const payout = event.payout;

        const data: CRMMessageData = {
            TournamentName: tournament.name,
            Threshold: event.trigger.threshold.toString(),
            Amount: formatMoney(payout.amount, 'USD'),
            JackpotName: jackpot.name,
            JackpotLabel: jackpot.label,
            JackpotType: jackpot.type,
            WinnerCount: event.winnerCount.toString()
        };

        await this.crmSender.send(payout.userId, UserNotificationType.Prize, CRMTemplateName.TournamentJackpotWin, {
            data
        });
    }
}

export const onTournamentJackpotWin = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentJackpotWinHandler).execute(event));
