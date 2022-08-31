import { Singleton, IocContainer, Inject } from '@tcom/platform/lib/core/ioc';
import { SNSEvent } from 'aws-lambda';
import { TournamentCompleteEvent, TournamentResultEvent, TournamentWinEvent } from '@tcom/platform/lib/tournament/events';
import { PlatformEventDispatcher, PlatformEventHandler } from '@tcom/platform/lib/core/events';
import { Config, JsonSerialiser, lambdaHandler } from '@tcom/platform/lib/core';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { LeaderboardInfo, LeaderboardManager } from '@tcom/platform/lib/leaderboard';
import { RankedTournamentEntry, Tournament, TournamentEntryManager, TournamentJackpotProcessor, TournamentManager, TournamentState } from '@tcom/platform/lib/tournament';
import _ from 'lodash';
import moment from 'moment';
import AWS from 'aws-sdk';


@Singleton
@LogClass()
class OnTournamentCompleteHandler extends PlatformEventHandler<TournamentCompleteEvent> {
    constructor(
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly entryManager: TournamentEntryManager,
        @Inject private readonly jackpotProcessor: TournamentJackpotProcessor,
        @Inject private readonly eventDispatcher: PlatformEventDispatcher,
        @Inject private readonly serialiser: JsonSerialiser) {
            super();
    }

    protected async process(event: Readonly<TournamentCompleteEvent>): Promise<void> {
        const tournament = await this.tournamentManager.get(event.payload.id);

        if (!tournament) {
            Logger.error(`Tournament ${event.payload.id} not found.`);
            return;
        }

        Logger.info('Tournament', tournament);

        if (tournament.leaderboardId)
            await this.processLeaderboard(tournament);
        else
            await this.processWinners(tournament);

        if ([TournamentState.Cancelled, TournamentState.Failed].includes(tournament.state) && tournament.entryCosts?.length > 0)
            await this.startRefunds(tournament);
    }

    private async processLeaderboard(tournament: Tournament): Promise<void> {
        if (!tournament.leaderboardId)
            throw new Error(`Tournament ${tournament.id} does not have a leaderboard ID`);

        const leaderboard = await this.leaderboardManager.getInfo(tournament.leaderboardId as number);

        if (!leaderboard) {
            Logger.error(`Leaderboard ${tournament.leaderboardId} not found.`);
            return;
        }

        if (!leaderboard.finalised)
            await this.leaderboardManager.finalise(leaderboard.id);

        const expiration = tournament.state === TournamentState.Ended ? moment().utc().add(3, 'days') : moment().utc().add(5, 'minutes');
        await this.leaderboardManager.expire(leaderboard.id, expiration.toDate());

        if (tournament.state !== TournamentState.Ended || tournament.playerCount === 0)
            return;

        await this.payout(tournament, leaderboard);
    }

    private async processWinners(tournament: Tournament): Promise<void> {
        if (tournament.playerCount === 0)
            return;

        if (tournament.state !== TournamentState.Ended)
            return;

        const winners = await this.entryManager.getWinners(tournament.id);

        if (winners.length === 0)
            return;

        await Promise.all(winners.map(e => this.eventDispatcher.send(new TournamentWinEvent(e.id, e.userId, e.tournamentId, e.prizes))));
        await this.eventDispatcher.send(new TournamentResultEvent(tournament.id, winners));
    }

    private async payout(tournament: Tournament, leaderboard: LeaderboardInfo): Promise<void> {
        const winners = await this.payoutLeaderboard(tournament, leaderboard);
        const payouts = await this.jackpotProcessor.process(tournament);

        if (!winners.length && !payouts.length)
            return;

        await this.eventDispatcher.send(new TournamentResultEvent(tournament.id, winners, payouts));
    }

    private async payoutLeaderboard(tournament: Tournament, leaderboard: LeaderboardInfo): Promise<RankedTournamentEntry[]> {
        if (tournament.playerCount === 0)
            return [];

        if (!tournament.autoPayout)
            return [];

        if (leaderboard.payoutTime) {
            Logger.error(`Leaderboard ${leaderboard.id} has already been paid out.`);
            return [];
        }

        if (tournament.playerCount < tournament.minPlayers) {
            Logger.warn(`Did not pay out leaderboard because the number of players (${tournament.playerCount}) did not meet the minimum of ${tournament.minPlayers}`);
            return [];
        }

        const awards = await this.leaderboardManager.payout(leaderboard.id);

        if (awards.length === 0)
            return [];

        const winners: RankedTournamentEntry[] = [];

        for (const award of awards) {
            const entry = await this.entryManager.get(tournament.id, award.userId) as RankedTournamentEntry;

            if (!entry)
                continue;

            await this.entryManager.addPrizes(entry.id, award.prizes);
            entry.prizes = award.prizes;
            entry.rank = award.rank;
            winners.push(entry);
        }

        const events = winners.map(e => new TournamentWinEvent(e.id, e.userId, e.tournamentId, e.prizes, e.rank));
        await this.eventDispatcher.send(...events);
        return winners;
    }

    private async startRefunds(tournament: Tournament): Promise<void> {
        if (tournament.playerCount === 0)
            return;

        const stepFunctions = new AWS.StepFunctions();
        const stateMachineArn = `arn:aws:states:${Config.region}:${Config.accountId}:stateMachine:refundTournament`;
        const response = await stepFunctions.startExecution({
            stateMachineArn,
            input: this.serialiser.serialise({
                tournamentId: tournament.id,
                processed: 0
            })
        }).promise();

        Logger.info(`Started Tournament ${tournament.id} refund state machine with execution ARN: ${response.executionArn}`);
    }
}

export const onComplete = lambdaHandler((event: SNSEvent) => IocContainer.get(OnTournamentCompleteHandler).execute(event));