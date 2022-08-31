import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentWinEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import _ from 'lodash';
import { CRMManager } from '@tcom/platform/lib/crm';
import { UserManager, UserType } from '@tcom/platform/lib/user';
import { CashPrize, PrizeType, TangiblePrize } from '@tcom/platform/lib/prize';
import { CRMEventType } from '../crm-event-type';
import { TournamentManager } from '@tcom/platform/lib/tournament';

@Singleton
@LogClass()
class OnTournamentWinHandler extends PlatformEventHandler<TournamentWinEvent> {
    constructor(
        @Inject private readonly userManager: UserManager,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly crmManager: CRMManager) {
            super();
    }

    protected async process(event: Readonly<TournamentWinEvent>): Promise<void> {
        const user = await this.userManager.get(event.userId);

        if (!user || user.type === UserType.Bot)
            return;

        const tournament = await this.tournamentManager.get(event.tournamentId);

        if (!tournament) {
            Logger.error(`Tournament ${event.tournamentId} not found.`);
            return;
        }

        const tangiblePrize = event.prizes.filter(p => p.type === PrizeType.Tangible) as TangiblePrize[];
        const cashPrizes = event.prizes.filter(p => p.type === PrizeType.Cash) as CashPrize[];

        const currencyCode = cashPrizes.length > 0 ? cashPrizes[0].currencyCode : 'USD';
        const prizeTotal = cashPrizes.length > 0 ? _.sumBy(cashPrizes, t => t.amount) : tangiblePrize[0].name;

        await this.crmManager.updateContact(event.userId, {
            hasTournamentWin: true,
            lastTournamentWin: new Date(event.timestamp)
        });

        await this.crmManager.addEvent(event.userId, CRMEventType.TournamentWin, {
            tournamentId: event.tournamentId,
            templateId: tournament.templateId,
            tournamentName: tournament.name,
            entryId: event.entryId,
            rank: event.rank,
            prizeTotal,
            currencyCode
        });
    }
}

export const onTournamentWin = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentWinHandler).execute(event));