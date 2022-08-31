import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { LeaderboardScheduleManager, LeaderboardPointAwarder, LeaderboardScheduleItem } from '@tcom/platform/lib/leaderboard';
import { PlatformEventHandler, PlatformEvent } from '@tcom/platform/lib/core/events';
import { TournamentEntryManager } from '@tcom/platform/lib/tournament';
import { TournamentWinEvent, TournamentEnteredEvent } from '@tcom/platform/lib/tournament/events';
import { SNSEvent } from 'aws-lambda';
import _ from 'lodash';
import { PrizeType, CashPrize } from '@tcom/platform/lib/prize';
import { UserManager } from '@tcom/platform/lib/user';

@Singleton
@LogClass()
class ProcessEventHandler extends PlatformEventHandler<PlatformEvent> {
    constructor(
        @Inject private readonly scheduleManager: LeaderboardScheduleManager,
        @Inject private readonly pointAwarder: LeaderboardPointAwarder,
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly userManager: UserManager) {
            super();
        }

    public async process(event: Readonly<PlatformEvent>): Promise<void> {
        const items = await this.scheduleManager.getCurrentItems(new Date(event.timestamp));

        if (items.length === 0)
            return;

        for (const item of items)
            await this.processItem(item, event);
    }

    private async processItem(item: LeaderboardScheduleItem, event: Readonly<PlatformEvent>): Promise<void> {
        switch (event.eventType) {
            case 'Tournament:Win':
                await this.processTournamentWin(item, event as TournamentWinEvent);
                break;

            case 'Tournament:Entered':
                await this.processTournamentEntered(item, event as TournamentEnteredEvent);
                break;
        }
    }

    private async processTournamentWin(item: LeaderboardScheduleItem, event: Readonly<TournamentWinEvent>): Promise<void> {
        const entry = await this.tournamentEntryManager.getById(event.entryId);

        if (!entry) {
            Logger.error(`Entry ${event.entryId} not found.`);
            return;
        }

        if (!await this.isEligible(entry.userId, item))
            return;

        // TODO: Convert to base currency (USD)
        const prizeTotal = _.sumBy(event.prizes.filter(p => p.type === PrizeType.Cash) as CashPrize[], t => t.amount);
        const intPrizeTotal = Math.trunc(prizeTotal);

        if (intPrizeTotal === 0)
            return;

        await this.pointAwarder.award(item.leaderboardId, entry.userId, 'TournamentWin', intPrizeTotal, {
            createEntry: true,
            sendWebsocketMessage: false
        });
    }

    private async processTournamentEntered(item: LeaderboardScheduleItem, event: Readonly<TournamentEnteredEvent>): Promise<void> {
        if (!await this.isEligible(event.payload.userId, item))
            return;

        await this.pointAwarder.award(item.leaderboardId, event.payload.userId, 'TournamentEntered', undefined, {
            createEntry: true,
            sendWebsocketMessage: false
        });
    }

    private async isEligible(userId: number, item: LeaderboardScheduleItem): Promise<boolean> {
        if (item.minLevel === 0)
            return true;

        const user = await this.userManager.get(userId);

        if (!user || !user.enabled)
            return false;

        return user.level >= item.minLevel;
    }
}

export const processEvent = lambdaHandler((event: SNSEvent) => IocContainer.get(ProcessEventHandler).execute(event));