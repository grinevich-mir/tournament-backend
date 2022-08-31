import { AdminController, Get, Route, Tags, Path, Query, Security } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { TransactionPurpose, WalletManager, WalletTransactionManager, WalletTransaction, WalletTransactionFilter } from '@tcom/platform/lib/banking';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Transactions')
@Route('banking/transaction')
@Security('admin', ['banking:wallet:transaction:read'])
@LogClass()
export class WalletTransactionController extends AdminController {
    constructor(
        @Inject private readonly walletManager: WalletManager,
        @Inject private readonly transactionManager: WalletTransactionManager) {
        super();
    }

    /**
     * @summary Gets all wallet transactions
     * @isInt page
     * @isInt pageSize
     */
    @Get()
    public async getAll(
        @Query() accountId?: number,
        @Query() walletId?: number,
        @Query() currencyCode?: string,
        @Query() purpose?: TransactionPurpose,
        @Query() from?: Date,
        @Query() to?: Date,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<WalletTransaction>> {
        const filter: WalletTransactionFilter = {
            accountId,
            walletId,
            currencyCode,
            purpose,
            from,
            to,
            page,
            pageSize
        };

        return this.transactionManager.getAll(filter);
    }

    /**
     * @summary Gets all wallet transactions for a user
     * @isInt page
     * @isInt pageSize
     */
    @Get('user/{userId}')
    public async getForUser(
        @Path() userId: number,
        @Query() currencyCode?: string,
        @Query() purpose?: TransactionPurpose,
        @Query() from?: Date,
        @Query() to?: Date,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<WalletTransaction>> {
        const wallet = await this.walletManager.getForUser(userId);

        if (!wallet)
            throw new NotFoundError('Wallet not found.');

        const filter: WalletTransactionFilter = {
            walletId: wallet.id,
            currencyCode,
            purpose,
            from,
            to,
            page,
            pageSize
        };

        return this.transactionManager.getAll(filter);
    }

    /**
     * @summary Gets a wallet transaction by ID
     */
    @Get('{id}')
    public async getById(
        @Path() id: number): Promise<WalletTransaction> {
        const transaction = await this.transactionManager.get(id);

        if (!transaction)
            throw new NotFoundError('Transaction not found.');

        return transaction;
    }
}
