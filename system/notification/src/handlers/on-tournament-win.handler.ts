import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import ordinal from 'ordinal';
import { TournamentWinEvent } from '@tcom/platform/lib/tournament/events';
import { Tournament, TournamentManager } from '@tcom/platform/lib/tournament';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { formatMoney } from '@tcom/platform/lib/banking/utilities';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMSender, CRMMessageData, CRMTemplateName } from '@tcom/platform/lib/crm';
import { CashPrize, PrizeType } from '@tcom/platform/lib/prize';
import _ from 'lodash';
import { UserManager, UserNotificationType } from '@tcom/platform/lib/user';
import { NotificationManager, NotificationType } from '@tcom/platform/lib/notification';

@Singleton
@LogClass()
class OnTournamentWinHandler extends PlatformEventHandler<TournamentWinEvent> {
    constructor(
        @Inject private readonly notificationManager: NotificationManager,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly crmSender: CRMSender) {
        super();
    }

    protected async process(event: Readonly<TournamentWinEvent>): Promise<void> {
        const tournament = await this.tournamentManager.get(event.tournamentId);

        if (!tournament) {
            Logger.error(`Tournament ${event.tournamentId} not found.`);
            return;
        }

        const data: any = {
            rank: event.rank,
            tournamentName: tournament.name,
            tournamentId: tournament.id,
            prizes: event.prizes
        };

        const cashPrizes = event.prizes.filter(p => p.type === PrizeType.Cash) as CashPrize[];

        if (cashPrizes.length > 0) {
            const currencyCode = cashPrizes[0].currencyCode;
            const prizeTotal = _.sumBy(cashPrizes, t => t.amount);

            data.prizeTotal = {
                currencyCode,
                amount: prizeTotal
            };
        }

        await this.notificationManager.add(NotificationType.TournamentWin, data, event.userId);

        if (!await this.userManager.isOnline(event.userId))
            await this.sendMessage(tournament, event);
    }

    private async sendMessage(tournament: Tournament, event: Readonly<TournamentWinEvent>): Promise<void> {
        const cashPrizes = event.prizes.filter(p => p.type === PrizeType.Cash) as CashPrize[];
        const currencyCode = cashPrizes.length ? cashPrizes[0].currencyCode : 'USD';
        const prizeTotal = _.sumBy(cashPrizes, t => t.amount);

        let template = CRMTemplateName.TournamentWin;

        const data: CRMMessageData = {
            TournamentName: tournament.name,
            PrizeTotal: formatMoney(prizeTotal, currencyCode),
        };

        if (event.rank) {
            template = CRMTemplateName.TournamentLeaderboardWin;
            data.LeaderboardRank = event.rank.toString();
            data.LeaderboardRankOrdinal = ordinal(event.rank);
        }

        await this.crmSender.send(event.userId, UserNotificationType.Prize, template, {
            data
        });
    }
}

export const onTournamentWin = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentWinHandler).execute(event));
