import _ from 'lodash';
import { PlatformEventDispatcher } from '../core/events';
import { Inject, Singleton } from '../core/ioc';
import Logger, { LogClass } from '../core/logging';
import { JackpotManager, JackpotPayout } from '../jackpot';
import { LeaderboardManager } from '../leaderboard';
import { UserManager } from '../user';
import { TournamentJackpotWinEvent } from './events';
import { Tournament } from './tournament';

@Singleton
@LogClass()
export class TournamentJackpotProcessor {
    constructor(
        @Inject private readonly jackpotManager: JackpotManager,
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher) {
        }

    public async process(tournament: Tournament): Promise<JackpotPayout[]> {
        if (!tournament.leaderboardId) {
            Logger.error(`Tournament ${tournament.id} does not have a leaderboard ID.`);
            return [];
        }

        if (!tournament.jackpotTriggers || tournament.jackpotTriggers.length === 0)
            return [];

        const triggers = _.chain(tournament.jackpotTriggers)
            .filter(t => t.enabled)
            .orderBy(w => w.threshold, 'desc')
            .value();

        const minTrigger = _.minBy(triggers, t => t.threshold);

        if (!minTrigger)
            return [];

        const winners = await this.leaderboardManager.getEntriesByPoints(tournament.leaderboardId, minTrigger.threshold);

        if (winners.length === 0)
            return [];

        const allPayouts: JackpotPayout[] = [];

        for (const trigger of triggers) {
            const triggerWinners = winners.filter(w => w.points >= trigger.threshold);

            if (triggerWinners.length === 0)
                continue;

            let winnerIds: number[] = [];

            if (trigger.minLevel > 0)
                for (const winner of triggerWinners) {
                    const user = await this.userManager.get(winner.userId);

                    if (!user) {
                        Logger.error(`Could not find user ${winner.userId} when paying out jackpot ${trigger.jackpotId}, skipped.`);
                        continue;
                    }

                    if (user.level < trigger.minLevel)
                        continue;

                    winnerIds.push(winner.userId);
                }
            else
                winnerIds = triggerWinners.map(t => t.userId);

            // Remove processed winners from winners array
            _.pull(winners, ...triggerWinners);

            if (winnerIds.length === 0)
                continue;

            const payouts = await this.jackpotManager.payout(trigger.jackpotId, winnerIds, `Tournament:${tournament.id}`);

            if (payouts.length === 0)
                continue;

            await Promise.all(payouts.map(p => this.eventDispatcher.send(new TournamentJackpotWinEvent(tournament.id, trigger, p, payouts.length))));

            allPayouts.push(...payouts);

            if (trigger.final)
                break;
        }

        return allPayouts;
    }
}