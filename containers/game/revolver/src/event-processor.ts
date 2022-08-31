import { Singleton, Inject } from '@tcom/platform/lib/core/ioc';
import { RevolverEvent } from './interfaces';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { GameBonusManager, GameSession, GameSessionManager } from '@tcom/platform/lib/game';
import { TournamentManager, TournamentState } from '@tcom/platform/lib/tournament';
import { LeaderboardPointAwarder } from '@tcom/platform/lib/leaderboard';

@Singleton
@LogClass()
export class EventProcessor {
    private readonly processPoints: boolean = false;

    constructor(
        @Inject private readonly sessionManager: GameSessionManager,
        @Inject private readonly bonusManager: GameBonusManager,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly pointAwarder: LeaderboardPointAwarder) {
    }

    public async process(event: RevolverEvent): Promise<void> {
        Logger.info('EVENT', event);

        const result = event.round.engineResult;
        if (!this.processPoints && Object.keys(result.triggeredBonusGames).length === 0)
            return;

        if (!event.player.sessionState || !event.player.sessionState.sessionId) {
            Logger.error('Game session ID missing from event sessionState.');
            return;
        }

        const sessionId = event.player.sessionState.sessionId;

        const session = await this.sessionManager.getBySecureId(sessionId);

        if (!session) {
            Logger.error(`Game session ${sessionId} does not exist.`);
            return;
        }

        await Promise.all([
            this.recordBonus(event, session),
            this.awardPoints(event, session)
        ]);
    }

    private async recordBonus(event: RevolverEvent, session: GameSession): Promise<void> {
        const result = event.round.engineResult;
        const roundId = event.round.roundId;

        if (Object.keys(result.triggeredBonusGames).length === 0)
            return;

        Logger.info('Bonus game(s) triggered.');
        await this.bonusManager.add({
            gameId: session.gameId,
            provider: session.provider,
            providerRef: roundId.toString(),
            userId: session.userId,
            reference: session.reference
        });
    }

    private async awardPoints(event: RevolverEvent, session: GameSession): Promise<void> {
        if (!this.processPoints)
            return;

        const result = event.round.engineResult;

        if (!session.metadata || !session.metadata.tournamentId)
            return;

        const tournament = await this.tournamentManager.get(session.metadata.tournamentId);

        if (!tournament) {
            Logger.error(`Tournament ${session.metadata.tournamentId} not found.`);
            return;
        }

        if (tournament.state > TournamentState.Finalising) {
            Logger.error(`Tournament ${tournament.id} has finished, event was too late.`);
            return;
        }

        if (!tournament.leaderboardId) {
            Logger.warn(`Tournament ${tournament.id} does not have a leaderboard.`);
            return;
        }

        // TODO: Determine if player hit a special event condition (e.g. Scatter)

        let eventName: string | undefined;
        let pointInput: number | undefined;

        if (result.totalWinCash > 0) {
            eventName = 'RoundWin';
            pointInput = result.totalWinCash;
        } else if (result.totalBetCash > 0) {
            eventName = 'RoundLose';
            pointInput = result.totalBetCash;
        }

        if (!eventName)
            return;

        await this.pointAwarder.award(tournament.leaderboardId, session.userId, eventName, pointInput);
    }
}