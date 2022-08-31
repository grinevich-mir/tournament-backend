import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentResultEvent, TournamentResultEventWinner } from '@tcom/platform/lib/tournament/events';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import _ from 'lodash';
import { CRMEventData, CRMEventSource, CRMManager, CRMMessageData, CRMRecipient, CRMSender, CRMTemplateName } from '@tcom/platform/lib/crm';
import { Tournament, TournamentEntryManager, TournamentManager } from '@tcom/platform/lib/tournament';
import { JackpotPayout } from '@tcom/platform/lib/jackpot';
import { CashPrize, PrizeType } from '@tcom/platform/lib/prize';
import { formatMoney } from '@tcom/platform/lib/banking/utilities';
import { LeaderboardManager } from '@tcom/platform/lib/leaderboard';
import { UserNotificationType } from '@tcom/platform/lib/user';
import { CRMEventType } from '../crm-event-type';

@Singleton
@LogClass()
class OnTournamentResultHandler extends PlatformEventHandler<TournamentResultEvent> {
    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly crmSender: CRMSender,
        @Inject private readonly crmManager: CRMManager) {
            super();
    }

    protected async process(event: Readonly<TournamentResultEvent>): Promise<void> {
        const tournament = await this.tournamentManager.get(event.tournamentId);

        if (!tournament) {
            Logger.error(`Tournament ${event.tournamentId} not found.`);
            return;
        }

        let participantIds: number[] = [];

        if (tournament.leaderboardId)
            participantIds = await this.processLeaderboardWinners(tournament, event.winners);
        else
            participantIds = await this.processWinners(tournament, event.winners);

        if (!participantIds.length || (!event.jackpotPayouts || !event.jackpotPayouts.length))
            return;

        await this.processJackpotPayouts(tournament, event.jackpotPayouts, participantIds);
    }

    private async processWinners(tournament: Tournament, winners: TournamentResultEventWinner[]): Promise<number[]> {
        const participants = await this.tournamentEntryManager.getAll(tournament.id);

        const nonWinners = participants.filter(p => !winners.find(w => w.userId === p.userId));

        if (nonWinners.length === 0)
            return participants.map(p => p.userId);

        const cashPrizes = _.flatMap(winners, w => w.prizes).filter(p => p.type === PrizeType.Cash) as CashPrize[];
        const prizeTotal = formatMoney(_.sumBy(cashPrizes, c => c.amount), tournament.currencyCode);

        const data: CRMEventData = {
            TournamentId: tournament.id,
            TournamentName: tournament.name,
            TemplateId: tournament.templateId,
            PrizeTotal: prizeTotal
        };

        const sources: CRMEventSource[] = nonWinners.map(n => ({
            userId: n.userId
        }));

        await this.crmManager.addEvents(sources, CRMEventType.TournamentLoss, data);
        return participants.map(p => p.userId);
    }

    private async processLeaderboardWinners(tournament: Tournament, winners: TournamentResultEventWinner[]): Promise<number[]> {
        if (!tournament.leaderboardId)
            throw new Error(`Tournament ${tournament.id} does not have a leaderboard ID`);

        const participants = await this.leaderboardManager.getEntriesByRank(tournament.leaderboardId as number);
        const nonWinners = participants.filter(p => !winners.find(w => w.userId === p.userId));

        if (nonWinners.length === 0)
            return participants.map(p => p.userId);

        const cashPrizes = _.flatMap(winners, w => w.prizes).filter(p => p.type === PrizeType.Cash) as CashPrize[];
        const prizeTotal = formatMoney(_.sumBy(cashPrizes, c => c.amount), tournament.currencyCode);

        const data: CRMEventData = {
            TournamentId: tournament.id,
            TemplateId: tournament.templateId,
            TournamentName: tournament.name,
            PrizeTotal: prizeTotal
        };

        const sources: CRMEventSource[] = nonWinners.map(n => ({
            userId: n.userId,
            data: {
                LeaderboardRank: n.rank
            }
        }));

        await this.crmManager.addEvents(sources, CRMEventType.TournamentLoss, data);
        return participants.map(p => p.userId);
    }

    private async processJackpotPayouts(tournament: Tournament, payouts: JackpotPayout[], participants: number[]): Promise<void> {
        const nonWinners = participants.filter(id => !payouts.find(p => p.userId === id));
        const jackpotCount = _.chain(payouts).groupBy(p => p.jackpotId).size().value();
        const totalAmount = formatMoney(_.sumBy(payouts, p => p.amount), 'USD');

        const data: CRMMessageData = {
            TournamentId: tournament.id,
            TemplateId: tournament.templateId,
            TournamentName: tournament.name,
            Amount: totalAmount,
            JackpotCount: jackpotCount
        };

        const recipients: CRMRecipient[] = nonWinners.map(n => ({
            userId: n
        }));

        await this.crmSender.sendAll(recipients, UserNotificationType.Marketing, CRMTemplateName.TournamentJackpotLoss, { data });
    }
}

export const onTournamentResult = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentResultHandler).execute(event));
