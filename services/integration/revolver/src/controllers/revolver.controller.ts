import { Controller, Post, Body, Route, SuccessResponse, Tags } from '@tcom/platform/lib/api';
import {
    GameAuthRequestModel,
    GameResponseModel,
    GameBalanceRequestModel,
    GameDebitRequestModel,
    GameDebitResponseModel,
    GameTransactionStatus,
    GameCreditRequestModel,
    GameCreditResponseModel,
    GameRollbackRequestModel,
    GameRollbackResponseModel,
    GameResponseCode,
    GameAuthResponseModel,
    GameBalanceResponseModel,
    GameDebitAndCreditRequestModel,
    GameDebitAndCreditResponseModel,
    GameCustomMessageModel
} from '../models';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import uuid from 'uuid/v4';
import { GameManager, GameSessionManager, GameSessionStatus } from '@tcom/platform/lib/game';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { SignatureValidator } from '../auth';
import { UserManager } from '@tcom/platform/lib/user';
import { centsToMoney, roundMoney, toMoney } from '@tcom/platform/lib/banking/utilities';
import { TournamentManager, TournamentEntryManager, TournamentState, TournamentLeaderboardPointMode } from '@tcom/platform/lib/tournament';
import _ from 'lodash';
import { LeaderboardPointAwarder, LeaderboardManager, LeaderboardProgressManager } from '@tcom/platform/lib/leaderboard';
import { CustomErrorResponseFactory, PendingRoundTracker } from '../utilities';
import { CustomErrorResponseType } from '../models/common';
import { LogRequest } from '../decorators';
import { ForbiddenError, NotFoundError } from '@tcom/platform/lib/core';

type GameResponse<T> = GameResponseModel<T> | GameResponseModel<GameCustomMessageModel>;

@Tags('Revolver')
@Route('revolver')
@LogClass()
export class RevolverController extends Controller {
    constructor(
        @Inject private readonly signatureValidator: SignatureValidator,
        @Inject private readonly sessionManager: GameSessionManager,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly pointAwarder: LeaderboardPointAwarder,
        @Inject private readonly leaderboardManager: LeaderboardManager,
        @Inject private readonly progressManager: LeaderboardProgressManager,
        @Inject private readonly gameManager: GameManager,
        @Inject private readonly errorResponseFactory: CustomErrorResponseFactory,
        @Inject private readonly roundTracker: PendingRoundTracker) {
        super();
    }

    /**
     * @summary Authenticates a user
     */
    @Post('auth')
    @SuccessResponse(200, 'Ok')
    @LogRequest('Auth')
    public async auth(@Body() request: GameAuthRequestModel): Promise<GameResponse<GameAuthResponseModel>> {
        if (!await this.signatureValidator.validate(request))
            return this.getErrorResponse(GameResponseCode.WrongSignature);

        const session = await this.sessionManager.getBySecureId(request.token);

        if (!session) {
            Logger.warn(`Session with secure ID '${request.token}' not found.`);
            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        if (session.status === GameSessionStatus.Closed) {
            Logger.warn(`Session '${session.id}' is closed.`);
            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        if (session.expireTime.getTime() <= Date.now() || session.status === GameSessionStatus.Expired) {
            Logger.warn(`Session ${session.id} has expired.`);

            if ([GameSessionStatus.Created || GameSessionStatus.Active].includes(session.status))
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Expired);

            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        const user = await this.userManager.get(session.userId);

        if (!user) {
            Logger.error(`User ${session.userId} not found.`);
            return this.getErrorResponse(GameResponseCode.UserNotFound);
        }

        let balance = 0;

        if (session.metadata.tournamentId) {
            const tournament = await this.tournamentManager.get(session.metadata.tournamentId);

            if (!tournament) {
                Logger.warn(`Tournament '${session.metadata.tournamentId}' not found.`);
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
                return this.getErrorResponse(GameResponseCode.InvalidToken);
            }

            if (tournament.state > TournamentState.Running) {
                Logger.warn(`Tournament '${tournament.id}' has ended.`);
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
                return this.getErrorResponse(GameResponseCode.InvalidToken);
            }

            const entry = await this.tournamentEntryManager.get(tournament.id, session.userId);

            if (!entry) {
                Logger.warn(`Entry for user ${session.userId} in tournament '${tournament.id}' not found.`);
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
                return this.getErrorResponse(GameResponseCode.UserNotFound);
            }

            if (!entry.activatedTime)
                await this.tournamentEntryManager.activate(entry.id);

            const allocation = this.tournamentEntryManager.getCurrentAllocation(entry);

            if (allocation)
                balance = allocation.credit || 0;
        }

        if (session.status === GameSessionStatus.Created)
            await this.sessionManager.setStatus(session.id, GameSessionStatus.Active);

        return {
            code: GameResponseCode.Success,
            data: {
                playerId: user.secureId,
                currency: 'DIA', // session.currencyCode,
                nickname: user.displayName || 'Anonymous',
                balance: toMoney(balance).convertPrecision(2).getAmount(),
                license: 'MT',
                countryCode: user.country || 'US',
                sessionState: {
                    sessionId: session.secureId
                }
            }
        };
    }

    /**
     * @summary Returns balance
     */
    @Post('balance')
    @SuccessResponse(200, 'Ok')
    @LogRequest('GetBalance')
    public async getBalance(@Body() request: GameBalanceRequestModel): Promise<GameResponse<GameBalanceResponseModel>> {
        if (!await this.signatureValidator.validate(request))
            return this.getErrorResponse(GameResponseCode.WrongSignature);

        if (!request.sessionState || !request.sessionState.sessionId) {
            Logger.error('Session ID missing from session state.');
            return this.getErrorResponse(GameResponseCode.BadRequest);
        }

        const session = await this.sessionManager.getBySecureId(request.sessionState.sessionId);

        if (!session) {
            Logger.warn(`Session with secure ID '${request.sessionState.sessionId}' not found.`);
            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        let balance = 0;

        if (session.metadata.tournamentId) {
            const tournament = await this.tournamentManager.get(session.metadata.tournamentId);

            if (!tournament) {
                Logger.warn(`Tournament '${session.metadata.tournamentId}' not found.`);
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
                return this.getErrorResponse(GameResponseCode.InvalidToken);
            }

            const entry = await this.tournamentEntryManager.get(session.metadata.tournamentId, session.userId);

            if (entry) {
                const allocation = this.tournamentEntryManager.getCurrentAllocation(entry);
                balance = allocation?.credit || 0;
            }
        }

        await this.sessionManager.extend(session.id);

        return {
            code: GameResponseCode.Success,
            data: {
                balance: toMoney(balance).convertPrecision(2).getAmount()
            }
        };
    }

    /**
     * @summary Debits the users wallet
     */
    @Post('debitAndCredit')
    @SuccessResponse(200, 'Ok')
    @LogRequest('DebitAndCredit')
    public async debitAndCredit(@Body() request: GameDebitAndCreditRequestModel): Promise<GameResponse<GameDebitAndCreditResponseModel>> {
        if (!await this.signatureValidator.validate(request))
            return this.getErrorResponse(GameResponseCode.WrongSignature);

        if (request.debitAmount < 0 || request.creditAmount < 0)
            return this.getErrorResponse(GameResponseCode.BadRequest);

        if (!request.sessionState || !request.sessionState.sessionId) {
            Logger.error('Session ID missing from session state.');
            return this.getErrorResponse(GameResponseCode.BadRequest);
        }

        const session = await this.sessionManager.getBySecureId(request.sessionState.sessionId);

        if (!session) {
            Logger.warn(`Session '${request.sessionState.sessionId}' not found.`);
            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        if (session.status === GameSessionStatus.Closed) {
            Logger.warn(`Session '${request.sessionState.sessionId}' is closed.`);
            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        if (session.expireTime.getTime() <= Date.now() || session.status === GameSessionStatus.Expired) {
            Logger.warn(`Session ${session.id} has expired.`);

            if ([GameSessionStatus.Created || GameSessionStatus.Active].includes(session.status))
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Expired);

            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        if (!session.metadata.tournamentId) {
            Logger.error(`Tournament ID not found on game session ${session.id}.`);
            return this.getErrorResponse(GameResponseCode.BadRequest);
        }

        const tournament = await this.tournamentManager.get(session.metadata.tournamentId);

        if (!tournament) {
            Logger.warn(`Tournament '${session.metadata.tournamentId}' not found.`);
            await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
            return this.getErrorResponse(GameResponseCode.BadRequest);
        }

        if (tournament.state > TournamentState.Running) {
            Logger.warn(`Tournament '${session.metadata.tournamentId}' has finished.`);
            await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
            return this.errorResponseFactory.create(CustomErrorResponseType.TournamentFinished);
        }

        if (tournament.state < TournamentState.Running) {
            Logger.warn(`Tournament '${session.metadata.tournamentId}' is not in a running state.`);
            return this.errorResponseFactory.create(CustomErrorResponseType.TournamentNotStarted);
        }

        const debitAmount = centsToMoney(request.debitAmount, 'USD');
        const entry = await this.tournamentEntryManager.get(tournament.id, session.userId);

        if (!entry) {
            Logger.warn(`Entry for user ${session.userId} in tournament '${tournament.id}' not found.`);
            await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
            return this.getErrorResponse(GameResponseCode.UserNotFound);
        }

        const allocation = this.tournamentEntryManager.getCurrentAllocation(entry);

        if (!allocation) {
            Logger.warn(`Entry ${entry.id} has no more available allocations.`);
            return this.errorResponseFactory.create(CustomErrorResponseType.EntryComplete);
        }

        let balance = allocation.credit || 0;
        const checkRounds = (allocation.rounds !== undefined && allocation.rounds !== null);
        const roundsRemaining = (allocation.rounds || 0) - 1;

        const game = await this.gameManager.get(session.gameId);

        if (!game) {
            Logger.error(`Game ${session.gameId} not found.`);
            return this.getErrorResponse(GameResponseCode.BadRequest);
        }

        if (game.metadata?.maxBet && centsToMoney(request.debitAmount, 'USD').greaterThan(toMoney(game.metadata.maxBet))) {
            Logger.error(`Player ${entry.userId} attempt to bet ${centsToMoney(request.debitAmount, 'USD').toUnit()} which is more than the maximum bet of ${game.metadata.maxBet}`);
            return this.getErrorResponse(GameResponseCode.BadRequest);
        }

        let newBalance = toMoney(balance).subtract(debitAmount);

        if (newBalance.isNegative()) {
            Logger.warn(`Entry ${entry.id} has insufficient credit.`);
            return this.errorResponseFactory.create(CustomErrorResponseType.InsuffientCredit);
        }

        if (checkRounds && roundsRemaining < 0) {
            Logger.warn(`Entry ${entry.id} has no rounds remaining.`);
            return this.errorResponseFactory.create(CustomErrorResponseType.InsufficientRounds);
        }

        if (game.metadata?.minBet && newBalance.lessThan(toMoney(game.metadata.minBet)))
            newBalance = toMoney(0);

        const complete = newBalance.isZero() || roundsRemaining === 0;
        const credit = roundMoney(newBalance, 'USD');

        await this.tournamentEntryManager.updateAllocation(entry.id, allocation.id, {
            credit,
            rounds: checkRounds ? Math.max((allocation.rounds || 0) - 1, 0) : undefined,
            complete
        });

        if (!complete)
            await this.sessionManager.extend(session.id);

        balance = !complete ? newBalance.toUnit() : 0;

        if (tournament.leaderboardId && tournament.leaderboardPointConfig) {
            let eventName = 'RoundLose';
            let points: number | undefined;

            if (request.creditAmount > 0) {
                points = request.creditAmount;
                eventName = 'RoundWin';
            }

            await this.pointAwarder.award(tournament.leaderboardId, entry.userId, eventName, points);

            if (complete) {
                if(tournament.leaderboardPointMode === TournamentLeaderboardPointMode.Highest)
                    await this.leaderboardManager.adjustPoints(tournament.leaderboardId, {
                        userId: entry.userId,
                        points: 0,
                        reset: 'Running'
                    });

                await this.progressManager.reset(tournament.leaderboardId, entry.userId);
            }
        }

        return {
            code: GameResponseCode.Success,
            data: {
                transactionId: uuid(),
                transactionStatus: GameTransactionStatus.Success,
                balance: toMoney(balance).convertPrecision(2).getAmount()
            }
        };
    }

    /**
     * @summary Debits the users wallet
     */
    @Post('debit')
    @SuccessResponse(200, 'Ok')
    @LogRequest('Debit')
    public async debit(@Body() request: GameDebitRequestModel): Promise<GameResponse<GameDebitResponseModel>> {
        if (!await this.signatureValidator.validate(request))
            return this.getErrorResponse(GameResponseCode.WrongSignature);

        if (request.amount < 0)
            return this.getErrorResponse(GameResponseCode.BadRequest);

        if (!request.sessionState || !request.sessionState.sessionId) {
            Logger.error('Session ID missing from session state.');
            return this.getErrorResponse(GameResponseCode.BadRequest);
        }

        const session = await this.sessionManager.getBySecureId(request.sessionState.sessionId);

        if (!session) {
            Logger.warn(`Session '${request.sessionState.sessionId}' not found.`);
            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        if (session.status === GameSessionStatus.Closed) {
            Logger.warn(`Session '${request.sessionState.sessionId}' is closed.`);
            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        if (session.expireTime.getTime() <= Date.now() || session.status === GameSessionStatus.Expired) {
            Logger.warn(`Session ${session.id} has expired.`);

            if ([GameSessionStatus.Created || GameSessionStatus.Active].includes(session.status))
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Expired);

            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        let balance = 0;

        const amount = centsToMoney(request.amount, 'USD');

        if (session.metadata.tournamentId) {
            const tournament = await this.tournamentManager.get(session.metadata.tournamentId);

            if (!tournament) {
                Logger.warn(`Tournament '${session.metadata.tournamentId}' not found.`);
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
                return this.getErrorResponse(GameResponseCode.InvalidToken);
            }

            if (tournament.state > TournamentState.Running) {
                Logger.warn(`Tournament '${session.metadata.tournamentId}' has finished.`);
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
                return this.errorResponseFactory.create(CustomErrorResponseType.TournamentFinished);
            }

            if (tournament.state < TournamentState.Running) {
                Logger.warn(`Tournament '${session.metadata.tournamentId}' is not in a running state.`);
                return this.errorResponseFactory.create(CustomErrorResponseType.TournamentNotStarted);
            }

            const entry = await this.tournamentEntryManager.get(tournament.id, session.userId);

            if (!entry) {
                Logger.warn(`Entry for user ${session.userId} in tournament '${tournament.id}' not found.`);
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
                return this.getErrorResponse(GameResponseCode.UserNotFound);
            }

            const allocation = this.tournamentEntryManager.getCurrentAllocation(entry);

            if (!allocation) {
                Logger.warn(`Entry ${entry.id} has no more available allocations.`);
                return this.errorResponseFactory.create(CustomErrorResponseType.EntryComplete);
            }

            balance = allocation.credit || 0;
            const checkRounds = (allocation.rounds !== undefined && allocation.rounds !== null);
            const roundsRemaining = (allocation.rounds || 0) - 1;

            const game = await this.gameManager.get(session.gameId);

            if (!game) {
                Logger.error(`Game ${session.gameId} not found.`);
                return this.getErrorResponse(GameResponseCode.BadRequest);
            }

            if (game.metadata?.maxBet && centsToMoney(request.amount, 'USD').greaterThan(toMoney(game.metadata.maxBet))) {
                Logger.error(`Player ${entry.userId} attempt to bet ${centsToMoney(request.amount, 'USD').toUnit()} which is more than the maximum bet of ${game.metadata.maxBet}`);
                return this.getErrorResponse(GameResponseCode.BadRequest);
            }

            let newBalance = toMoney(balance).subtract(amount);

            if (newBalance.isNegative()) {
                Logger.warn(`Entry ${entry.id} has insufficient credit.`);
                return this.errorResponseFactory.create(CustomErrorResponseType.InsuffientCredit);
            }

            if (checkRounds && roundsRemaining < 0) {
                Logger.warn(`Entry ${entry.id} has no rounds remaining.`);
                return this.errorResponseFactory.create(CustomErrorResponseType.InsufficientRounds);
            }

            if (game.metadata?.minBet && newBalance.lessThan(toMoney(game.metadata.minBet)))
                newBalance = toMoney(0);

            const complete = request.isRoundFinished && newBalance.isZero() || roundsRemaining === 0;
            const credit = roundMoney(newBalance, 'USD');

            await this.tournamentEntryManager.updateAllocation(entry.id, allocation.id, {
                credit,
                rounds: checkRounds ? Math.max((allocation.rounds || 0) - 1, 0) : undefined,
                complete
            });

            if (!complete)
                await this.sessionManager.extend(session.id);

            balance = !complete ? newBalance.toUnit() : 0;

            if (!request.isRoundFinished)
                await this.roundTracker.store(request.roundId, entry.id.toString());
        }

        return {
            code: GameResponseCode.Success,
            data: {
                transactionId: uuid(),
                transactionStatus: GameTransactionStatus.Success,
                balance: toMoney(balance).convertPrecision(2).getAmount()
            }
        };
    }

    /**
     * @summary Credits the users wallet
     */
    @Post('credit')
    @SuccessResponse(200, 'Ok')
    @LogRequest('Credit')
    public async credit(@Body() request: GameCreditRequestModel): Promise<GameResponse<GameCreditResponseModel>> {
        if (!await this.signatureValidator.validate(request))
            return this.getErrorResponse(GameResponseCode.WrongSignature);

        if (!request.sessionState || !request.sessionState.sessionId)
            return this.getErrorResponse(GameResponseCode.BadRequest, 'Session ID missing from session state.');

        const session = await this.sessionManager.getBySecureId(request.sessionState.sessionId);

        if (!session) {
            Logger.warn(`Session '${request.sessionState.sessionId}' not found.`);
            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        let balance = 0;

        if (session.metadata.tournamentId) {
            const tournament = await this.tournamentManager.get(session.metadata.tournamentId);

            if (!tournament) {
                Logger.warn(`Tournament '${session.metadata.tournamentId}' not found.`);
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
                return this.getErrorResponse(GameResponseCode.InvalidToken);
            }

            const entry = await this.tournamentEntryManager.get(session.metadata.tournamentId, session.userId);

            if (!entry) {
                Logger.warn(`Entry for user ${session.userId} in tournament '${session.metadata.tournamentId}' not found.`);
                return this.getErrorResponse(GameResponseCode.UserNotFound);
            }

            const pendingRound = await this.roundTracker.getAndRemove(request.roundId);

            if (pendingRound?.reference !== entry.id.toString()) {
                Logger.warn(`Round ID ${request.roundId} does not match expected entry ID of ${entry.id}, ignoring credit.`);
                return {
                    code: GameResponseCode.Success,
                    data: {
                        transactionId: uuid(),
                        transactionStatus: GameTransactionStatus.Success,
                        balance: toMoney(balance).convertPrecision(2).getAmount()
                    }
                };
            }

            const allocation = this.tournamentEntryManager.getCurrentAllocation(entry);
            let complete = false;

            if (allocation) {
                balance = allocation.credit || 0;
                const roundsRemaining = (allocation.rounds || 0) - 1;

                complete = !allocation.complete && balance === 0 || roundsRemaining === 0;

                if (complete) {
                    await this.tournamentEntryManager.updateAllocation(entry.id, allocation.id, {
                        complete
                    });
                    await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
                }
            }

            if (tournament.leaderboardId && tournament.leaderboardPointConfig) {
                let eventName = 'RoundLose';
                let points: number | undefined;

                if (request.amount > 0) {
                    points = request.amount;
                    eventName = 'RoundWin';
                }

                try {
                    await this.pointAwarder.award(tournament.leaderboardId, entry.userId, eventName, points);
                } catch (err) {
                    if (err instanceof ForbiddenError || err instanceof NotFoundError)
                        Logger.warn(`Could not award ${points} ${eventName} point(s) to user ${entry.userId} on leaderboard ${tournament.leaderboardId}`, err);
                    else
                        throw err;
                }

                if (complete) {
                    if(tournament.leaderboardPointMode === TournamentLeaderboardPointMode.Highest)
                        await this.leaderboardManager.adjustPoints(tournament.leaderboardId, {
                            userId: entry.userId,
                            points: 0,
                            reset: 'Running'
                        });

                    await this.progressManager.reset(tournament.leaderboardId, entry.userId);
                }
            }
        }

        return {
            code: GameResponseCode.Success,
            data: {
                transactionId: uuid(),
                transactionStatus: GameTransactionStatus.Success,
                balance: toMoney(balance).convertPrecision(2).getAmount()
            }
        };
    }

    /**
     * @summary Rollback a transaction
     */
    @Post('rollback')
    @SuccessResponse(200, 'Ok')
    @LogRequest('Rollback')
    public async rollback(@Body() request: GameRollbackRequestModel): Promise<GameResponseModel<GameRollbackResponseModel>> {
        if (!await this.signatureValidator.validate(request))
            return this.getErrorResponse(GameResponseCode.WrongSignature);

        if (!request.sessionState || !request.sessionState.sessionId) {
            Logger.error('Session ID missing from session state.');
            return this.getErrorResponse(GameResponseCode.BadRequest);
        }

        const session = await this.sessionManager.getBySecureId(request.sessionState.sessionId);

        if (!session) {
            Logger.warn(`Session with secure ID '${request.sessionState.sessionId}' not found.`);
            return this.getErrorResponse(GameResponseCode.InvalidToken);
        }

        let balance = 0;

        if (session.metadata.tournamentId) {
            const tournament = await this.tournamentManager.get(session.metadata.tournamentId);

            if (!tournament) {
                Logger.warn(`Tournament '${session.metadata.tournamentId}' not found.`);
                await this.sessionManager.setStatus(session.id, GameSessionStatus.Closed);
                return this.getErrorResponse(GameResponseCode.InvalidToken);
            }

            const entry = await this.tournamentEntryManager.get(session.metadata.tournamentId, session.userId);

            if (entry) {
                const allocation = this.tournamentEntryManager.getCurrentAllocation(entry);
                balance = allocation?.credit || 0;
            }
        }

        return {
            code: GameResponseCode.Success,
            data: {
                transactionId: uuid(),
                transactionStatus: GameTransactionStatus.Rollback,
                balance: toMoney(balance).convertPrecision(2).getAmount()
            }
        };
    }

    private getErrorResponse(code: GameResponseCode, message?: string): GameResponseModel {
        if (code === GameResponseCode.WrongSignature)
            Logger.error('Revolver error: Wrong Signature');
        else
            Logger.warn(`Revolver error: code ${code} (${GameResponseCode[code]})`);

        return { code, message };
    }
}
