import { AdminController, Get, Route, Tags, Path, Query, Security } from '@tcom/platform/lib/api';
import { Inject } from '@tcom/platform/lib/core/ioc';
import { UserWalletAccounts, WalletAccount, WalletAccountManager, WalletAccountFilter, WalletManager } from '@tcom/platform/lib/banking';
import { NotFoundError, PagedResult } from '@tcom/platform/lib/core';
import { LogClass } from '@tcom/platform/lib/core/logging';

@Tags('Accounts')
@Route('banking/account')
@Security('admin', ['banking:wallet:account:read'])
@LogClass()
export class WalletAccountController extends AdminController {
    constructor(
        @Inject private readonly walletManager: WalletManager,
        @Inject private readonly accountManager: WalletAccountManager) {
        super();
    }

    /**
     * @summary Gets all wallet accounts
     * @isInt skip
     * @isInt take
     */
    @Get()
    public async getAll(
        @Query() walletId?: number,
        @Query() name?: UserWalletAccounts,
        @Query() currencyCode?: string,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<WalletAccount>> {
        const filter: WalletAccountFilter = {
            walletId,
            name,
            currencyCode,
            page,
            pageSize
        };

        return this.accountManager.getAll(filter);
    }

    /**
     * @summary Gets all wallet accounts for a user
     * @isInt page
     * @isInt pageSize
     */
    @Get('user/{userId}')
    public async getForUser(
        @Path() userId: number,
        @Query() page: number = 1,
        @Query() pageSize: number = 20): Promise<PagedResult<WalletAccount>> {
        const wallet = await this.walletManager.getForUser(userId);

        if (!wallet)
            throw new NotFoundError('Wallet not found.');

        const filter: WalletAccountFilter = {
            walletId: wallet.id,
            page,
            pageSize
        };

        return this.accountManager.getAll(filter);
    }

    /**
     * @summary Gets a wallet account by ID
     */
    @Get('{id}')
    public async getById(@Path() id: number): Promise<WalletAccount> {
        const account = await this.accountManager.get(id);

        if (!account)
            throw new NotFoundError('Account not found.');

        return account;
    }
}
