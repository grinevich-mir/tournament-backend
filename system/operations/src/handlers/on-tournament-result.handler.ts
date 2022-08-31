import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentResultEvent } from '@tcom/platform/lib/tournament/events';
import { TournamentManager } from '@tcom/platform/lib/tournament';
import { PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { formatMoney } from '@tcom/platform/lib/banking/utilities';
import { lambdaHandler, NotFoundError } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import _ from 'lodash';
import { User, UserManager } from '@tcom/platform/lib/user';
import { Jackpot, JackpotManager, JackpotPayout } from '@tcom/platform/lib/jackpot';
import { EmailSender } from '../email-sender';
import { EmailGroup } from '../email-group';

@Singleton
@LogClass()
class OnTournamentResultHandler extends PlatformEventHandler<TournamentResultEvent> {
    constructor(
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly jackpotManager: JackpotManager,
        @Inject private readonly sender: EmailSender) {
            super();
    }

    protected async process(event: Readonly<TournamentResultEvent>): Promise<void> {
        const tournament = await this.tournamentManager.get(event.tournamentId);

        if (!tournament) {
            Logger.error(`Tournament ${event.tournamentId} not found.`);
            return;
        }

        const jackpotPayouts = event.jackpotPayouts;

        if (!jackpotPayouts || !jackpotPayouts.length)
            return;

        const jackpots = await this.getJackpots(jackpotPayouts);
        const users = await this.getJackpotUsers(jackpotPayouts);

        const totalPayout = this.formatAmount(_.sumBy(jackpotPayouts, p => p.amount));

        const data = {
            tournament: {
                id: tournament.id,
                templateId: tournament.templateId,
                name: tournament.name,
                playerCount: tournament.playerCount,
                startTime: tournament.startTime.toISOString()
            },
            totalPayout,
            jackpotCount: jackpots.length,
            jackpots: jackpots.map(j => this.mapJackpot(j, jackpotPayouts.filter(p => p.jackpotId === j.id), users))
        };

        await this.sender.send('TournamentJackpotPayout', data, EmailGroup.Admin);
    }

    private async getJackpotUsers(payouts: JackpotPayout[]): Promise<User[]> {
        const jackpotUsers: User[] = [];

        for (const payout of payouts) {
            const user = await this.userManager.get(payout.userId);

            if (!user)
                throw new NotFoundError(`Could not find jackpot winner user ${payout.userId}`);

            if (!jackpotUsers.find(u => u.id === payout.userId))
                jackpotUsers.push(user);
        }

        return jackpotUsers;
    }

    private async getJackpots(payouts: JackpotPayout[]): Promise<Jackpot[]> {
        const jackpots: Jackpot[] = [];

        for (const payout of payouts) {
            const jackpot = await this.jackpotManager.get(payout.jackpotId);

            if (!jackpot)
                throw new NotFoundError(`Could not find jackpot ${payout.jackpotId}`);

            if (!jackpots.find(j => j.id === payout.jackpotId))
                jackpots.push(jackpot);
        }

        return jackpots;
    }

    private mapJackpot(jackpot: Jackpot, payouts: JackpotPayout[], users: User[]): any {
        return {
            id: jackpot.id,
            name: jackpot.name,
            type: jackpot.type,
            payoutCount: payouts.length,
            totalPayout: this.formatAmount(_.chain(payouts).filter(p => p.jackpotId === jackpot.id).sumBy(p => p.amount).value()),
            payouts: payouts.map(p => {
                const user = users.find(u => u.id === p.userId) as User;
                return {
                    id: p.id,
                    userId: p.userId,
                    displayName: user.displayName || 'Unknown',
                    amount: this.formatAmount(p.amount),
                    date: p.createTime.toISOString()
                };
            })
        };
    }

    private formatAmount(amount: number): string {
        return formatMoney(amount, 'USD');
    }
}

export const onTournamentResult = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentResultHandler).execute(event));
