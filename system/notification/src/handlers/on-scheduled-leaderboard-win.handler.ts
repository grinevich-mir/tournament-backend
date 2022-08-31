import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import ordinal from 'ordinal';
import { ScheduledLeaderboardWinEvent } from '@tcom/platform/lib/leaderboard/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { formatMoney } from '@tcom/platform/lib/banking/utilities';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { CRMSender, CRMMessageData, CRMTemplateName } from '@tcom/platform/lib/crm';
import { CashPrize, PrizeType } from '@tcom/platform/lib/prize';
import _ from 'lodash';
import { UserManager, UserNotificationType } from '@tcom/platform/lib/user';
import { LeaderboardScheduleItem, LeaderboardScheduleManager } from '@tcom/platform/lib/leaderboard';
import { NotificationManager, NotificationType } from '@tcom/platform/lib/notification';

@Singleton
@LogClass()
class OnScheduledLeaderboardWinHandler extends PlatformEventHandler<ScheduledLeaderboardWinEvent> {
    constructor(
        @Inject private readonly notificationManager: NotificationManager,
        @Inject private readonly scheduleManager: LeaderboardScheduleManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly crmSender: CRMSender) {
            super();
    }

    protected async process(event: Readonly<ScheduledLeaderboardWinEvent>): Promise<void> {
        const scheduleItem = await this.scheduleManager.getItem(event.itemId);

        if (!scheduleItem) {
            Logger.error(`Leaderboard schedule item ${event.itemId} not found.`);
            return;
        }

        const data: any  = {
            rank: event.rank,
            scheduleName: scheduleItem.scheduleName,
            scheduleFrequency: scheduleItem.frequency,
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

        await this.notificationManager.add(NotificationType.ScheduledLeaderboardWin, data, event.userId);

        if (!await this.userManager.isOnline(event.userId))
            await this.sendMessage(scheduleItem, event);
    }

    private async sendMessage(scheduleItem: LeaderboardScheduleItem, event: Readonly<ScheduledLeaderboardWinEvent>): Promise<void> {
        const cashPrizes = event.prizes.filter(p => p.type === PrizeType.Cash) as CashPrize[];
        const currencyCode = cashPrizes[0].currencyCode;
        const prizeTotal = _.sumBy(cashPrizes, t => t.amount);

        const data: CRMMessageData = {
            LeaderboardScheduleName: scheduleItem.scheduleName,
            LeaderboardScheduleFrequency: scheduleItem.frequency,
            PrizeTotal: formatMoney(prizeTotal, currencyCode),
            LeaderboardRank: event.rank.toString(),
            LeaderboardRankOrdinal: ordinal(event.rank)
        };

        await this.crmSender.send(event.userId, UserNotificationType.Prize, CRMTemplateName.ScheduledLeaderboardWin, {
            data
        });
    }
}

export const onScheduledLeaderboardWin = lambdaHandler((event: SNSEvent) => IocContainer.get(OnScheduledLeaderboardWinHandler).execute(event));
