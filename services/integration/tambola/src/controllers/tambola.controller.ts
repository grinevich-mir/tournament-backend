import { Controller, Post, Body, Security, Response, Route, SuccessResponse, Tags, IdempotencyCache } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { GameResultRequestModel, GameBalanceRequestModel, GameAuthRequestModel, GameDebitRequestModel, GameCreditRequestModel, GameRollbackRequestModel } from '../models';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '@tcom/platform/lib/core/errors';
import { UserWalletAccounts, Ledger, TransactionPurpose, RequesterType, PlatformWallets, WalletAccountManager } from '@tcom/platform/lib/banking';
import { NotFoundError } from '@tcom/platform/lib/core';
import { TournamentRoundResult, TournamentEntryManager, TournamentManager, TournamentEntry, TournamentRuntimeManager, TournamentState } from '@tcom/platform/lib/tournament';
import Logger, { LogClass } from '@tcom/platform/lib/core/logging';
import { UserManager } from '@tcom/platform/lib/user';
import { PrizeType, Prize } from '@tcom/platform/lib/prize';
import { centsToMoney, toMoney } from '@tcom/platform/lib/banking/utilities';

@Tags('Tambola')
@Route('tambola')
@Security('tambola')
@LogClass()
export class TambolaController extends Controller {
    constructor(
        @Inject private readonly tournamentEntryManager: TournamentEntryManager,
        @Inject private readonly tournamentManager: TournamentManager,
        @Inject private readonly tournamentRuntimeManager: TournamentRuntimeManager,
        @Inject private readonly walletAccountManager: WalletAccountManager,
        @Inject private readonly ledger: Ledger,
        @Inject private readonly userManager: UserManager,
        @Inject private readonly idempotencyCache: IdempotencyCache) {
        super();
    }

    /**
     * @summary Authenticates a user
     */
    @Post('auth')
    @SuccessResponse(200, 'Ok')
    @Response<UnauthorizedError>(401)
    @Response<NotFoundError>(404)
    public async auth(@Body() request: GameAuthRequestModel): Promise<any> {
        Logger.debug('AUTH', request);

        const gameId = Number(request.gameId);

        if (isNaN(gameId))
            throw new BadRequestError('Invalid Game ID.');

        const entry = await this.tournamentEntryManager.getByToken(request.token);

        if (!entry)
            throw new NotFoundError('Entry not found.');

        if (gameId !== entry.tournamentId)
            throw new ForbiddenError(`Entry does not belong to tournament ${entry.tournamentId}`);

        const account = await this.walletAccountManager.getForUser(entry.userId, UserWalletAccounts.Withdrawable);

        if (!account)
            throw new NotFoundError('Wallet not found.');

        const user = await this.userManager.get(entry.userId);

        if (!user)
            throw new NotFoundError('User not found.');

        if (!entry.activatedTime)
            await this.tournamentEntryManager.activate(entry.id);

        const country = 'US';

        return {
            player: {
                playerId: user.secureId,
                region: country,
                language: 'en', // TODO: THIS ISN'T NEEDED, GET REMOVED
                nickname: user.displayName || 'Anonymous',
                currency: account.currencyCode,
                balance: toMoney(account.balance).getAmount()
            }
        };
    }

    /**
     * @summary Returns the users balance
     */
    @Post('balance')
    @SuccessResponse(200, 'Ok')
    @Response<NotFoundError>(404)
    @Response<UnauthorizedError>(401)
    public async balance(@Body() request: GameBalanceRequestModel): Promise<any> {
        Logger.debug('BALANCE', request);

        const entry = await this.tournamentEntryManager.getByToken(request.token);

        if (!entry)
            throw new NotFoundError('Tournament entry not found.');

        const account = await this.walletAccountManager.getForUser(entry.userId, UserWalletAccounts.Withdrawable);

        if (!account)
            throw new NotFoundError('Account not found.');

        return {
            player: {
                currency: account.currencyCode,
                balance: toMoney(account.balance).getAmount()
            }
        };
    }

    /**
     * @summary Debits a users account
     */
    @Post('debit')
    @SuccessResponse(200, 'Ok')
    @Response<NotFoundError>(404)
    @Response<UnauthorizedError>(401)
    public async debit(@Body() request: GameDebitRequestModel): Promise<any> {
        Logger.debug('DEBIT', request);

        return this.idempotencyCache.get(`debit-${request.transactionId}`, async () => {
            const entry = await this.tournamentEntryManager.getByToken(request.token);

            if (!entry)
                throw new NotFoundError('Tournament entry not found.');

            const tournament = await this.tournamentManager.get(entry.tournamentId);

            if (!tournament)
                throw new NotFoundError('Tournament not found.');

            const targetAccount = tournament.currencyCode !== 'DIA' ? UserWalletAccounts.Withdrawable : UserWalletAccounts.Diamonds;

            const amount = centsToMoney(request.totalAmount, tournament.currencyCode).toUnit();

            const walletEntry = await this.ledger.transfer(amount, tournament.currencyCode)
                .purpose(TransactionPurpose.BuyIn)
                .requestedBy(RequesterType.System, `Bingo:${request.gameId}`)
                .externalRef(request.transactionId)
                .memo(`Buy In for Bingo game ${request.gameId}`)
                .fromUser(entry.userId, targetAccount)
                .toPlatform(PlatformWallets.Corporate)
                .commit();

            const account = await this.walletAccountManager.getForUser(entry.userId, targetAccount);

            if (!account)
                throw new NotFoundError('Wallet not found.');

            this.setStatus(200);
            return {
                player: {
                    currency: account.currencyCode,
                    balance: toMoney(account.balance).getAmount(),
                    transactionId: walletEntry.id,
                    transactionStatus: 2
                }
            };
        });
    }

    /**
     * @summary Credits a users account
     */
    @Post('credit')
    @SuccessResponse(200, 'Ok')
    @Response<NotFoundError>(404)
    @Response<UnauthorizedError>(401)
    public async credit(@Body() request: GameCreditRequestModel): Promise<any> {
        Logger.debug('CREDIT', request);

        return this.idempotencyCache.get(`credit-${request.transactionId}`, async () => {
            const entry = await this.tournamentEntryManager.getByToken(request.token);

            if (!entry)
                throw new NotFoundError('tournament entry not found.');

            const tournament = await this.tournamentManager.get(entry.tournamentId);

            if (!tournament)
                throw new NotFoundError('Tournament not found.');

            const targetAccount = tournament.currencyCode !== 'DIA' ? UserWalletAccounts.Withdrawable : UserWalletAccounts.Diamonds;

            const amount = centsToMoney(request.amount, tournament.currencyCode).toUnit();

            const walletEntry = await this.ledger.transfer(amount, tournament.currencyCode)
                .purpose(TransactionPurpose.PayOut)
                .requestedBy(RequesterType.System, `Bingo:${request.gameId}`)
                .externalRef(`Bingo:${request.transactionId}`)
                .memo(`Pay Out for Bingo game ${request.gameId}`)
                .fromPlatform(PlatformWallets.Prize)
                .toUser(entry.userId, targetAccount)
                .commit();

            const account = await this.walletAccountManager.getForUser(entry.userId, targetAccount);

            if (!account)
                throw new NotFoundError('Account not found.');

            const prize: Prize = {
                type: PrizeType.Cash,
                amount,
                currencyCode: tournament.currencyCode
            };

            await this.tournamentEntryManager.addPrize(entry.id, prize);

            this.setStatus(200);
            return {
                player: {
                    currency: account.currencyCode,
                    balance: toMoney(account.balance).getAmount(),
                    transactionId: walletEntry.id,
                    transactionStatus: 2
                }
            };
        });
    }

    /**
     * @summary Rollback a transaction
     */
    @Post('rollback')
    @SuccessResponse(200, 'Ok')
    @Response<NotFoundError>(404)
    @Response<UnauthorizedError>(401)
    public async rollback(@Body() request: GameRollbackRequestModel): Promise<any> {
        Logger.debug('ROLLBACK', request);

        return this.idempotencyCache.get(`rollback-${request.transactionId}`, async () => {
            const tournament = await this.tournamentManager.get(Number(request.gameId));

            if (!tournament)
                throw new NotFoundError('Tournament not found.');

            const entry = await this.tournamentEntryManager.getByToken(request.token);

            if (!entry)
                throw new NotFoundError('tournament entry not found.');

            const targetAccount = tournament.currencyCode !== 'DIA' ? UserWalletAccounts.Withdrawable : UserWalletAccounts.Diamonds;

            const amount = centsToMoney(request.totalAmount, tournament.currencyCode).toUnit();

            const walletEntry = await this.ledger.transfer(amount, tournament.currencyCode)
                .purpose(TransactionPurpose.BuyIn)
                .requestedBy(RequesterType.System, `Bingo:${request.gameId}`)
                .externalRef(`Bingo:${request.transactionId}`)
                .memo(`Buy In for Bingo game ${request.gameId}`)
                .fromUser(entry.userId, targetAccount)
                .toPlatform(PlatformWallets.Prize, true)
                .commit();

            const account = await this.walletAccountManager.getForUser(entry.userId, targetAccount);

            if (!account)
                throw new NotFoundError('Account not found.');

            this.setStatus(200);
            return {
                player: {
                    currency: account.currencyCode,
                    balance: toMoney(account.balance).getAmount(),
                    transactionId: walletEntry.id,
                    transactionStatus: 2
                }
            };
        });
    }

    /**
     * @summary Sends a game result to tournament engine
     */
    @Post('game_result')
    @SuccessResponse(200, 'Ok')
    @Response<NotFoundError>(404)
    @Response<UnauthorizedError>(401)
    public async sendGameResult(@Body() request: GameResultRequestModel): Promise<void> {
        Logger.debug('RESULT', request);

        const results: TournamentRoundResult[] = [];
        const tournamentId = Number(request.gameId);

        const tournament = await this.tournamentManager.get(tournamentId);

        if (!tournament)
            throw new NotFoundError('Tournament not found.');

        for (const position of Object.keys(request.winners))
            for (const winner of request.winners[position]) {

                const entry = await this.getEntry(tournamentId, winner.token);
                if (!entry)
                    throw new NotFoundError('Tournament entry not found.');

                results.push({
                    event: position,
                    userId: entry.userId,
                    points: this.calculatePoints(position)
                });
            }

        try {
            if (tournament.state <= TournamentState.Running)
                await this.tournamentRuntimeManager.complete(tournament);
        } catch (err) {
            Logger.error(err);
        }

        this.setStatus(200);
    }

    private calculatePoints(prize: string): number {
        switch (prize) {
            case 'jackpot':
                return 4;
            case 'Full House':
                return 3;
            case 'One-Line Bingo':
                return 2;
            case 'Two-Line Bingo':
                return 1;
            default:
                return 0;
        }
    }

    private async getEntry(tournamentId: number, token: string): Promise<TournamentEntry | undefined> {
        if (token.length === 36) {
            const user = await this.userManager.get(token);

            if (!user)
                throw new Error('User not found.');

            return this.tournamentEntryManager.get(tournamentId, user.id);
        }

        return this.tournamentEntryManager.getByToken(token);
    }
}
