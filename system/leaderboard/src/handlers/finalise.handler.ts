import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { LeaderboardScheduleManager, LeaderboardManager, LeaderboardScheduleItem } from '@tcom/platform/lib/leaderboard';
import moment from 'moment';
import { PlatformEventDispatcher } from '@tcom/platform/lib/core/events';
import { ScheduledLeaderboardWinEvent } from '@tcom/platform/lib/leaderboard/events';

@Singleton
@LogClass()
class FinaliseHandler {
    constructor(
        @Inject private readonly scheduleManager: LeaderboardScheduleManager,
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
        }

    public async execute(): Promise<void> {
        const endedItems = await this.scheduleManager.getEndedItems(false);

        for (const item of endedItems) {
            const threshold = moment(item.endTime).add(15, 'minutes');

            if (threshold.isAfter())
                continue;

            try {
                await this.process(item);
            } catch (err) {
                Logger.error(err);
            }
        }
    }

    private async process(item: LeaderboardScheduleItem): Promise<void> {
        await this.leaderboardManager.finalise(item.leaderboardId);
        const expireTime = moment(item.endTime).add(7, 'days').toDate();
        await this.leaderboardManager.expire(item.leaderboardId, expireTime);
        await this.scheduleManager.finaliseItem(item.id);

        if (!item.autoPayout)
            return;

        const awards = await this.leaderboardManager.payout(item.leaderboardId);

        if (awards.length === 0)
            return;

        await Promise.all(awards.map(a => this.eventDispatcher.send(new ScheduledLeaderboardWinEvent(item.id, a.userId, a.prizes, a.rank))));
    }
}

export const finalise = lambdaHandler(() => IocContainer.get(FinaliseHandler).execute());