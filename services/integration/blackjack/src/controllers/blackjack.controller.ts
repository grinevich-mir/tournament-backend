import { Controller, Post, Body, Route, Tags, Security, Idempotent } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { Ledger, TransactionPurpose, RequesterType, PlatformWallets, UserWalletAccounts } from '@tcom/platform/lib/banking';
import { BadRequestError, ForbiddenError, GeneralError } from '@tcom/platform/lib/core/errors';
import { NotFoundError } from '@tcom/platform/lib/core';
import { TournamentState, TournamentManager, TournamentEntryManager, Tournament, TournamentEntry, TournamentLeaderboardPointMode, TournamentRuntimeManager } from '@tcom/platform/lib/tournament';
import Logger, { LogClass, LogLevel, LogMethod } from '@tcom/platform/lib/core/logging';
import { UserManager } from '@tcom/platform/lib/user';
import _ from 'lodash';
import { LeaderboardManager, LeaderboardAdjustment } from '@tcom/platform/lib/leaderboard';
import { PrizeType, Prize } from '@tcom/platform/lib/prize';
import {
    GameAuthRequestModel,
    GameAuthResponseModel,
    GameCreditRequestModel,
    GameCreditResponseModel,
    GameRoundRequestModel,
    GameResultRequestModel,
    GameLeaderboardRequestModel,
    GameLeaderboardResponseModel,
    GameLeaderboardTopRequestModel,
    GameLeaderboardPositionModel,
    GameRoundResultModel,
    GameLeaderboardInfoRequestModel,
    GameLeaderboardInfoResponseModel
} from '../models';
import moment from 'moment';

@Tags('Blackjack')
@Route('blackjack')
@Security('blackjack')
@LogClass()
export class BlackjackController extends Controller {
    constructor(
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly tournamentRuntimeManager: TournamentRuntimeManager,
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly ledger: Ledger) {
        super();
    }

    /**
     * @summary Authenticates a user
     */
    @Post('auth')
    @LogMethod({ level: LogLevel.Info })
    public async auth(@Body() request: GameAuthRequestModel): Promise<GameAuthResponseModel> {
        Logger.debug('AUTH', request);

        const gameId = request.gameId;

        if (isNaN(gameId))
            throw new BadRequestError('Invalid Game ID.');

        const entry = await this.tournamentEntryManager.getByToken(request.token);

        if (!entry)
            throw new NotFoundError('Entry not found.');

        if (gameId !== entry.tournamentId)
            throw new ForbiddenError(`Entry does not belong to tournament ${entry.tournamentId}`);

        const user = await this.userManager.get(entry.userId);

        if (!user)
            throw new NotFoundError('User not found.');

        if (!entry.activatedTime)
            await this.tournamentEntryManager.activate(entry.id);

        return {
            playerId: user.secureId,
            token: entry.token,
            nickname: user.displayName || 'Anonymous'
        };
    }

    /**
     * @summary Credits a user
     */
    @Post('credit')
    @LogMethod({ level: LogLevel.Info })
    @Idempotent()
    public async credit(@Body() request: GameCreditRequestModel): Promise<GameCreditResponseModel> {
        Logger.debug('CREDIT');

        const gameId = Number(request.gameId);
        const entry = await this.getEntry(gameId, request.token);

        if (!entry)
            throw new NotFoundError('Tournament entry not found.');

        const targetAccount = request.currency !== 'DIA' ? UserWalletAccounts.Withdrawable : UserWalletAccounts.Diamonds;

        const walletEntry = await this.ledger.transfer(request.amount, request.currency)
            .purpose(TransactionPurpose.PayOut)
            .requestedBy(RequesterType.System, `Blackjack:${request.gameId}`)
            .externalRef(request.transactionId)
            .memo(`Pay Out for Blackjack game ${request.gameId}`)
            .fromPlatform(PlatformWallets.Prize)
            .toUser(entry.userId, targetAccount)
            .commit();

        const prize: Prize = {
            type: PrizeType.Cash,
            amount: request.amount,
            currencyCode: request.currency
        };

        await this.tournamentEntryManager.addPrize(entry.id, prize);

        return {
            transactionId: walletEntry.id.toString()
        };
    }

    /**
     * @summary Game round result
     */
    @Post('game_round')
    @LogMethod({ level: LogLevel.Info })
    @Idempotent()
    public async gameRound(@Body() request: GameRoundRequestModel): Promise<void> {
        Logger.debug('GAME ROUND', request);

        const tournamentId = Number(request.gameId);
        const tournament = await this.tournamentManager.get(tournamentId);

        if (!tournament)
            throw new NotFoundError('Tournament not found.');

        const adjustments: LeaderboardAdjustment[] = [];

        for (const token of Object.keys(request.results)) {
            const result = request.results[token];

            if (!result.complete && !tournament.leaderboardId)
                continue;

            const entry = await this.getEntry(tournamentId, token);

            if (!entry) {
                Logger.error(`Entry with ${token} does not exist.`);
                continue;
            }

            if (tournament.leaderboardId) {
                const adjustment = this.createPointAdjustment(tournament, entry, result);
                if (adjustment)
                    adjustments.push(adjustment);
            }

            if (result.complete) {
                const allocation = this.tournamentEntryManager.getCurrentAllocation(entry);

                if (!allocation)
                    continue;

                await this.tournamentEntryManager.updateAllocation(entry.id, allocation.id, {
                    complete: true
                });
            }
        }

        if (tournament.leaderboardId && adjustments.length > 0)
            await this.leaderboardManager.adjustPoints(tournament.leaderboardId, ...adjustments);

        if (!request.lastRound)
            return;

        try {
            if (tournament.state <= TournamentState.Running)
                await this.tournamentRuntimeManager.complete(tournament);
        } catch (err) {
            Logger.error(err);
        }
    }

    /**
     * @summary Game result
     */
    @Post('game_result')
    @LogMethod({ level: LogLevel.Info })
    @Idempotent()
    public async gameResult(@Body() request: GameResultRequestModel): Promise<void> {
        Logger.debug('GAME RESULT', request);

        const tournamentId = Number(request.gameId);

        const tournament = await this.tournamentManager.get(tournamentId);

        if (!tournament)
            throw new NotFoundError('tournament not found.');

        if (!request.results) {
            try {
                if (tournament.state <= TournamentState.Running)
                    await this.tournamentRuntimeManager.complete(tournament);
            } catch (err) {
                Logger.error(err);
            }
            this.setStatus(200);
            return;
        }

        for (const token of Object.keys(request.results)) {
            const amount = request.results[token];

            if (amount <= 0)
                continue;

            const entry = await this.getEntry(tournamentId, token);

            if (!entry)
                throw new NotFoundError('tournament entry not found.');

            const targetAccount = tournament.currencyCode !== 'DIA' ? UserWalletAccounts.Withdrawable : UserWalletAccounts.Diamonds;

            await this.ledger.transfer(amount, tournament.currencyCode)
                .purpose(TransactionPurpose.PayOut)
                .requestedBy(RequesterType.System, 'Blackjack')
                .memo(`Pay Out for Blackjack game ${request.gameId}`)
                .fromPlatform(PlatformWallets.Prize)
                .toUser(entry.userId, targetAccount)
                .commit();

            const prize: Prize = {
                type: PrizeType.Cash,
                amount,
                currencyCode: tournament.currencyCode
            };

            await this.tournamentEntryManager.addPrize(entry.id, prize);
        }

        try {
            if (tournament.state <= TournamentState.Running)
                await this.tournamentRuntimeManager.complete(tournament);
        } catch (err) {
            Logger.error(err);
        }

        this.setStatus(200);
    }

    /**
     * @summary Gets basic leaderboard info for the game
     */
    @Post('leaderboard/info')
    public async leaderboardInfo(@Body() request: GameLeaderboardInfoRequestModel): Promise<GameLeaderboardInfoResponseModel> {
        Logger.debug('LEADERBOARD INFO', request);

        const gameId = request.gameId;

        if (isNaN(gameId))
            throw new BadRequestError('Invalid Game ID.');

        const tournament = await this.tournamentManager.get(gameId) as Tournament;

        if (!tournament.leaderboardId)
            throw new GeneralError(`Tournament ${tournament.id} does not have a leaderboard.`);

        const leaderboard = await this.leaderboardManager.getInfo(tournament.leaderboardId);

        if (!leaderboard)
            throw new NotFoundError('Leaderboard not found.');

        return {
            totalCount: leaderboard.entryCount,
            prizes: leaderboard.prizes
        };
    }

    /**
     * @summary Gets the leaderboard for the game
     */
    @Post('leaderboard')
    public async leaderboard(@Body() request: GameLeaderboardRequestModel): Promise<GameLeaderboardResponseModel> {
        Logger.debug('LEADERBOARD', request);

        const gameId = request.gameId;

        if (isNaN(gameId))
            throw new BadRequestError('Invalid Game ID.');

        const entry = await this.tournamentEntryManager.getByToken(request.token);

        if (!entry)
            throw new NotFoundError('Entry not found.');

        if (gameId !== entry.tournamentId)
            throw new ForbiddenError(`Entry does not belong to tournament ${entry.tournamentId}`);

        const tournament = await this.tournamentManager.get(gameId) as Tournament;

        if (!tournament.leaderboardId)
            throw new GeneralError(`Tournament ${tournament.id} does not have a leaderboard.`);

        const leaderboard = await this.leaderboardManager.getAroundUser(tournament.leaderboardId, entry.userId, request.count);

        if (!leaderboard)
            throw new NotFoundError('Leaderboard not found.');

        return {
            totalCount: leaderboard.entryCount,
            prizes: leaderboard.prizes,
            positions: leaderboard.entries.map(p => ({
                rank: p.rank,
                points: p.points,
                displayName: p.displayName,
                isPlayer: p.userId === entry.userId
            }))
        };
    }

    /**
     * @summary Gets top leaderboard for the game
     */
    @Post('leaderboard/top')
    public async leaderboardTop(@Body() request: GameLeaderboardTopRequestModel): Promise<GameLeaderboardResponseModel> {
        Logger.debug('LEADERBOARD TOP', request);

        const gameId = request.gameId;

        if (isNaN(gameId))
            throw new BadRequestError('Invalid Game ID.');

        const entry = await this.tournamentEntryManager.getByToken(request.token);

        if (!entry)
            throw new NotFoundError('Entry not found.');

        if (gameId !== entry.tournamentId)
            throw new ForbiddenError(`Entry does not belong to tournament ${entry.tournamentId}`);

        const tournament = await this.tournamentManager.get(gameId) as Tournament;

        if (!tournament.leaderboardId)
            throw new GeneralError(`Tournament ${tournament.id} does not have a leaderboard.`);

        const leaderboard = await this.leaderboardManager.get(tournament.leaderboardId, 0, request.count);

        if (!leaderboard)
            throw new NotFoundError('Leaderboard not found.');

        return {
            totalCount: leaderboard.entryCount,
            prizes: leaderboard.prizes,
            positions: leaderboard.entries.map<GameLeaderboardPositionModel>(p => ({
                rank: p.rank,
                points: p.points,
                displayName: p.displayName,
                isPlayer: p.userId === entry.userId
            }))
        };
    }

    private async getEntry(tournamentId: number, token: string): Promise<TournamentEntry | undefined> {
        if (token.length === 36) {
            const user = await this.userManager.get(token);

            if (!user)
                throw new NotFoundError('User not found.');

            return this.tournamentEntryManager.get(tournamentId, user.id);
        }

        return this.tournamentEntryManager.getByToken(token);
    }

    private createPointAdjustment(tournament: Tournament, entry: TournamentEntry, result: GameRoundResultModel): LeaderboardAdjustment | undefined {
        const adjustment: LeaderboardAdjustment = {
            userId: entry.userId,
            points: result.points || 0,
            tieBreaker: moment().utc().subtract(result.timeTaken, 'seconds').toDate()
        };

        if (result.knockout) {
            if (tournament.leaderboardPointMode === TournamentLeaderboardPointMode.Cumulative)
                return;

            if (tournament.leaderboardPointMode === TournamentLeaderboardPointMode.Highest)
                adjustment.reset = 'Running';
        }

        return adjustment;
    }
}
